-- ============================================================
-- МАСШТАБ — Initial Migration (Phase 1)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'premium');
CREATE TYPE language_code     AS ENUM ('uk', 'ru', 'en');
CREATE TYPE theme_mode        AS ENUM ('auto', 'dark', 'light');
CREATE TYPE journal_type      AS ENUM ('stage', 'morning', 'evening', 'weekly', 'free');
CREATE TYPE ai_context_type   AS ENUM ('general', 'belief_stage', 'belief_create', 'task_planning', 'weekly_review');
CREATE TYPE goal_period       AS ENUM ('year', 'quarter');
CREATE TYPE sphere_key        AS ENUM (
  'business', 'finance', 'health', 'relationships',
  'learning', 'spiritual', 'fun', 'environment'
);

-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT,
  language             language_code        NOT NULL DEFAULT 'uk',
  timezone             TEXT,
  subscription_tier    subscription_tier    NOT NULL DEFAULT 'free',
  subscription_expires TIMESTAMPTZ,
  onboarding_done      BOOLEAN              NOT NULL DEFAULT FALSE,
  morning_reminder     TIME                 NOT NULL DEFAULT '08:00:00',
  evening_reminder     TIME                 NOT NULL DEFAULT '20:00:00',
  weekly_checkin_day   SMALLINT             NOT NULL DEFAULT 0 CHECK (weekly_checkin_day BETWEEN 0 AND 6),
  ai_messages_today    INTEGER              NOT NULL DEFAULT 0,
  ai_messages_date     DATE,
  theme_mode           theme_mode           NOT NULL DEFAULT 'auto',
  created_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  profiles                  IS 'User profile data, extends auth.users';
COMMENT ON COLUMN profiles.weekly_checkin_day IS '0=Sunday, 1=Monday ... 6=Saturday';

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. BELIEFS (catalog, public read-only)
-- ============================================================

CREATE TABLE beliefs (
  id                        SERIAL PRIMARY KEY,
  category                  TEXT        NOT NULL,
  belief_uk                 TEXT        NOT NULL,
  belief_ru                 TEXT        NOT NULL DEFAULT '',
  belief_en                 TEXT        NOT NULL DEFAULT '',
  conviction_uk             TEXT        NOT NULL DEFAULT '',
  conviction_ru             TEXT        NOT NULL DEFAULT '',
  conviction_en             TEXT        NOT NULL DEFAULT '',
  source_hypothesis_uk      TEXT        NOT NULL DEFAULT '',
  source_hypothesis_ru      TEXT        NOT NULL DEFAULT '',
  source_hypothesis_en      TEXT        NOT NULL DEFAULT '',
  new_belief_template_uk    TEXT        NOT NULL DEFAULT '',
  new_belief_template_ru    TEXT        NOT NULL DEFAULT '',
  new_belief_template_en    TEXT        NOT NULL DEFAULT '',
  experiment_template_uk    TEXT        NOT NULL DEFAULT '',
  experiment_template_ru    TEXT        NOT NULL DEFAULT '',
  experiment_template_en    TEXT        NOT NULL DEFAULT '',
  identity_template_uk      TEXT        NOT NULL DEFAULT '',
  identity_template_ru      TEXT        NOT NULL DEFAULT '',
  identity_template_en      TEXT        NOT NULL DEFAULT '',
  order_index               INTEGER     NOT NULL DEFAULT 0,
  is_active                 BOOLEAN     NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE beliefs IS 'Catalog of 30 limiting beliefs (read-only for users)';

CREATE INDEX idx_beliefs_category  ON beliefs (category);
CREATE INDEX idx_beliefs_active    ON beliefs (is_active, order_index);

-- ============================================================
-- 3. DIAGNOSTIC_ANSWERS
-- ============================================================

CREATE TABLE diagnostic_answers (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  belief_id   INTEGER     NOT NULL REFERENCES beliefs(id)  ON DELETE CASCADE,
  score       SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 10),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  diagnostic_answers       IS 'Results of onboarding diagnostic (score 1–10 per belief)';
COMMENT ON COLUMN diagnostic_answers.score IS '1=minimal impact, 10=maximal impact';

CREATE INDEX idx_diagnostic_user ON diagnostic_answers (user_id);

-- ============================================================
-- 4. USER_BELIEFS (catalog + custom)
-- ============================================================

CREATE TABLE user_beliefs (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  belief_id        INTEGER              REFERENCES beliefs(id)   ON DELETE SET NULL,
  score            SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 10),
  score_after      SMALLINT             CHECK (score_after BETWEEN 1 AND 10),
  current_stage    SMALLINT    NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 6),
  completed_stages JSONB       NOT NULL DEFAULT '{}',

  -- Custom belief fields (null when belief_id is set)
  custom_belief     TEXT,
  custom_conviction TEXT,
  custom_source     TEXT,
  custom_new_belief TEXT,
  custom_experiment TEXT,
  custom_identity   TEXT,

  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraint: must have either belief_id or custom_belief
  CONSTRAINT belief_or_custom CHECK (
    belief_id IS NOT NULL OR custom_belief IS NOT NULL
  )
);

COMMENT ON TABLE  user_beliefs              IS 'User active beliefs (from catalog or custom)';
COMMENT ON COLUMN user_beliefs.belief_id    IS 'NULL for custom beliefs';
COMMENT ON COLUMN user_beliefs.score        IS 'Initial impact score 1–10';
COMMENT ON COLUMN user_beliefs.score_after  IS 'Re-assessment after completing all 6 stages';
COMMENT ON COLUMN user_beliefs.completed_stages IS '{"identify":true,"explore":true,...}';

CREATE INDEX idx_user_beliefs_user     ON user_beliefs (user_id);
CREATE INDEX idx_user_beliefs_active   ON user_beliefs (user_id, completed_at) WHERE completed_at IS NULL;

-- ============================================================
-- 5. JOURNAL_ENTRIES
-- ============================================================

CREATE TABLE journal_entries (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID         NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  type            journal_type NOT NULL,
  user_belief_id  UUID                  REFERENCES user_beliefs(id)  ON DELETE SET NULL,
  stage_key       TEXT,
  content         JSONB        NOT NULL DEFAULT '{}',
  date            DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- stage_key is required for type='stage'
  CONSTRAINT stage_key_required CHECK (
    type <> 'stage' OR stage_key IS NOT NULL
  )
);

COMMENT ON TABLE  journal_entries      IS 'All journal entries: ritual, stage reflections, free notes';
COMMENT ON COLUMN journal_entries.type IS 'stage | morning | evening | weekly | free';

/*
  content structure by type:
  morning: { intention, gratitude: [3], belief_of_day: uuid, focus_task_ids: [uuid] }
  evening: { wins: [3], learned, tomorrow, focus_results: [{task_id, completed}] }
  weekly:  { wins_of_week, didnt_work, focus_next_week, belief_progress_note, energy_level }
  stage:   { text }
  free:    { text }
*/

CREATE INDEX idx_journal_user_date ON journal_entries (user_id, date DESC);
CREATE INDEX idx_journal_type      ON journal_entries (user_id, type);
CREATE INDEX idx_journal_belief    ON journal_entries (user_belief_id) WHERE user_belief_id IS NOT NULL;

-- ============================================================
-- 6. AI_CONVERSATIONS
-- ============================================================

CREATE TABLE ai_conversations (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID            NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  user_belief_id  UUID                     REFERENCES user_beliefs(id) ON DELETE SET NULL,
  stage_key       TEXT,
  context_type    ai_context_type NOT NULL DEFAULT 'general',
  title           TEXT            NOT NULL DEFAULT '',
  messages        JSONB           NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  ai_conversations          IS 'AI coach conversation history';
COMMENT ON COLUMN ai_conversations.messages IS '[{role, content, timestamp}]';

CREATE INDEX idx_ai_user         ON ai_conversations (user_id, updated_at DESC);
CREATE INDEX idx_ai_belief       ON ai_conversations (user_belief_id) WHERE user_belief_id IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. GOALS
-- ============================================================

CREATE TABLE goals (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  sphere          sphere_key  NOT NULL,
  period          goal_period NOT NULL DEFAULT 'quarter',
  user_belief_id  UUID                 REFERENCES user_beliefs(id) ON DELETE SET NULL,
  due_date        DATE,
  is_completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE goals IS 'Goal containers (year/quarter) linked to spheres and beliefs';

CREATE INDEX idx_goals_user        ON goals (user_id, is_completed, sort_order);
CREATE INDEX idx_goals_sphere      ON goals (user_id, sphere);
CREATE INDEX idx_goals_belief      ON goals (user_belief_id) WHERE user_belief_id IS NOT NULL;

-- ============================================================
-- 8. TASKS
-- ============================================================

CREATE TABLE tasks (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  goal_id         UUID                 REFERENCES goals(id)        ON DELETE SET NULL,
  user_belief_id  UUID                 REFERENCES user_beliefs(id) ON DELETE SET NULL,
  title           TEXT        NOT NULL,
  date            DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_focus        BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE  tasks          IS 'Concrete daily actions, optionally linked to goals and beliefs';
COMMENT ON COLUMN tasks.is_focus IS 'Max 3 focus tasks per day';

CREATE INDEX idx_tasks_user_date   ON tasks (user_id, date);
CREATE INDEX idx_tasks_goal        ON tasks (goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX idx_tasks_belief      ON tasks (user_belief_id) WHERE user_belief_id IS NOT NULL;
CREATE INDEX idx_tasks_focus       ON tasks (user_id, date, is_focus) WHERE is_focus = TRUE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE beliefs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_beliefs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- beliefs (public read-only catalog)
CREATE POLICY "Public read beliefs"
  ON beliefs FOR SELECT USING (TRUE);

-- diagnostic_answers
CREATE POLICY "Users own diagnostic_answers"
  ON diagnostic_answers FOR ALL USING (auth.uid() = user_id);

-- user_beliefs
CREATE POLICY "Users own user_beliefs"
  ON user_beliefs FOR ALL USING (auth.uid() = user_id);

-- journal_entries
CREATE POLICY "Users own journal_entries"
  ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- ai_conversations
CREATE POLICY "Users own ai_conversations"
  ON ai_conversations FOR ALL USING (auth.uid() = user_id);

-- goals
CREATE POLICY "Users own goals"
  ON goals FOR ALL USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "Users own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Goal progress: % of completed tasks
CREATE OR REPLACE FUNCTION goal_progress(goal_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE is_completed) * 100.0) / COUNT(*), 1)
    END
  FROM tasks
  WHERE tasks.goal_id = goal_progress.goal_id;
$$;

-- AI daily message limit check
CREATE OR REPLACE FUNCTION check_ai_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier          subscription_tier;
  v_msgs_today    INTEGER;
  v_msgs_date     DATE;
BEGIN
  SELECT subscription_tier, ai_messages_today, ai_messages_date
  INTO v_tier, v_msgs_today, v_msgs_date
  FROM profiles
  WHERE id = p_user_id;

  -- Premium: unlimited
  IF v_tier = 'premium' THEN RETURN TRUE; END IF;

  -- Free: no access
  IF v_tier = 'free' THEN RETURN FALSE; END IF;

  -- Standard: 20/day, reset if new day
  IF v_msgs_date IS NULL OR v_msgs_date < CURRENT_DATE THEN
    UPDATE profiles
    SET ai_messages_today = 0, ai_messages_date = CURRENT_DATE
    WHERE id = p_user_id;
    v_msgs_today := 0;
  END IF;

  RETURN v_msgs_today < 20;
END;
$$;

-- Increment AI message counter
CREATE OR REPLACE FUNCTION increment_ai_messages(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    ai_messages_today = CASE
      WHEN ai_messages_date < CURRENT_DATE OR ai_messages_date IS NULL THEN 1
      ELSE ai_messages_today + 1
    END,
    ai_messages_date = CURRENT_DATE
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- SCHEDULED JOBS (pg_cron)
-- ============================================================

-- Daily AI counter reset at midnight UTC
SELECT cron.schedule(
  'reset-ai-daily-counters',
  '0 0 * * *',
  $$
    UPDATE profiles
    SET ai_messages_today = 0, ai_messages_date = CURRENT_DATE
    WHERE ai_messages_date < CURRENT_DATE;
  $$
);

-- ============================================================
-- SEED: 30 Catalog Beliefs (Ukrainian, Фаза 1)
-- ============================================================

INSERT INTO beliefs (
  category,
  belief_uk, belief_ru, belief_en,
  conviction_uk,
  source_hypothesis_uk,
  new_belief_template_uk,
  experiment_template_uk,
  identity_template_uk,
  order_index
) VALUES

-- PRICING (ціноутворення)
('pricing',
 'Я не можу встановлювати високі ціни',
 'Я не могу устанавливать высокие цены',
 'I cannot charge high prices',
 'Якщо я підніму ціни — клієнти підуть до конкурентів',
 'Батьки вчили не «жадібничати», я боюся відмови',
 'Я встановлюю ціни, що відображають реальну цінність моєї роботи',
 'Підніміть ціну на один продукт/послугу на 15% і відстежте реакцію 5 клієнтів',
 'Я підприємець, який цінує свою роботу і встановлює справедливі ціни',
 1),

('pricing',
 'Я маю бути дешевшим за конкурентів',
 'Я должен быть дешевле конкурентов',
 'I must be cheaper than competitors',
 'Якщо ціна вища — ніхто не купить',
 'Страх програти конкурентам через ціну, а не якість',
 'Клієнти обирають мене за цінністю, а не найнижчою ціною',
 'Знайдіть 3 конкурентів, які дорожчі за вас, і вивчіть їхнє позиціонування',
 'Я бізнес, що конкурує якістю і сервісом, а не демпінгом',
 2),

('pricing',
 'Просити гроші — це незручно і соромно',
 'Просить деньги — это неловко и стыдно',
 'Asking for money feels awkward and shameful',
 'Коли кажу ціну — почуваюся жадібним або нав''язливим',
 'Культурний патерн «не говорити про гроші», сором''язливість у продажах',
 'Називаючи ціну, я даю клієнту можливість отримати цінність',
 'Назвіть ціну першими на 3 наступних зустрічах без вибачень',
 'Я впевнено говорю про ціну, бо вірю у цінність свого продукту',
 3),

-- DELEGATION (делегування)
('delegation',
 'Якщо хочеш зробити добре — зроби сам',
 'Хочешь сделать хорошо — сделай сам',
 'If you want something done right, do it yourself',
 'Інші зроблять гірше, ніж я. Легше самому.',
 'Негативний досвід делегування або перфекціонізм',
 'Я будую систему, де інші виконують завдання на 80% так само добре',
 'Делегуйте одне завдання цього тижня і прийміть результат без правок',
 'Я лідер, який розвиває команду і масштабує бізнес через людей',
 4),

('delegation',
 'У мене немає часу пояснювати — швидше зробити самому',
 'Нет времени объяснять — быстрее сделать самому',
 'No time to explain — faster to do it myself',
 'Навчання займає більше часу, ніж просто виконати',
 'Короткострокове мислення, пастка «зайнятого засновника»',
 'Час на навчання команди — це інвестиція, що окупається місяцями',
 'Проведіть 30-хвилинне навчання і зафіксуйте, скільки часу зекономили за тиждень',
 'Я інвестую час у людей, щоб вивільнити своє майбутнє',
 5),

('delegation',
 'Ніхто не знає мій бізнес так, як я',
 'Никто не знает мой бизнес так, как я',
 'Nobody knows my business like I do',
 'Тільки я розумію всі нюанси — делегувати ризиковано',
 'Его засновника, страх втрати контролю',
 'Я документую знання і будую системи, де команда приймає правильні рішення',
 'Запишіть відеоінструкцію для одного процесу і передайте в команду',
 'Я будівник систем, а не єдина точка відмови в своєму бізнесі',
 6),

-- FEAR (страхи)
('fear',
 'Я боюся провалитися і що подумають інші',
 'Я боюсь провалиться и что подумают другие',
 'I fear failure and what others will think',
 'Якщо не вийде — всі побачать і засудять',
 'Соціальний страх оцінки, перфекціонізм',
 'Провал — це зворотній зв''язок, а не вирок',
 'Зробіть щось публічно «недосконале» і зафіксуйте реакцію',
 'Я підприємець, який вчиться швидше за інших завдяки сміливості пробувати',
 7),

('fear',
 'Зараз не найкращий час починати',
 'Сейчас не самое лучшее время начинать',
 'Now is not the right time to start',
 'Умови недосконалі — треба почекати кращого моменту',
 'Прокрастинація, замаскована під стратегічне мислення',
 'Ідеальний момент не настане — дія створює умови',
 'Визначте ОДИН крок, який можна зробити сьогодні, без очікування',
 'Я людина, яка діє в умовах невизначеності і створює свій момент',
 8),

('fear',
 'Конкуренти сильніші, у мене немає шансів',
 'Конкуренты сильнее, у меня нет шансов',
 'Competitors are stronger, I have no chance',
 'Ринок зайнятий, великі гравці знищать мене',
 'Порівняння на ранній стадії з mature бізнесами',
 'Конкуренція підтверджує попит — я знаходжу свою нішу',
 'Знайдіть 3 клієнти, яким великі конкуренти не підходять, і зрозумійте чому',
 'Я нішевий гравець, що виграє там, де великі програють',
 9),

-- SELF-WORTH (самооцінка)
('selfworth',
 'Я недостатньо компетентний для цього рівня',
 'Я недостаточно компетентен для этого уровня',
 'I am not competent enough for this level',
 'Інші знають більше, вони справжні експерти, а я ні',
 'Синдром самозванця, порівняння публічного образу інших зі своїм внутрішнім станом',
 'Я маю достатньо знань для наступного кроку і продовжую навчатися',
 'Перелічіть 10 речей, що ви вмієте краще за більшість у вашій ніші',
 'Я компетентний практик, який постійно зростає',
 10),

('selfworth',
 'Хто я такий, щоб брати стільки грошей?',
 'Кто я такой, чтобы брать столько денег?',
 'Who am I to charge that much?',
 'Я не заслуговую на такий дохід — є кращі за мене',
 'Низька самооцінка, знецінення власного досвіду',
 'Моя ціна відображає цінність результату для клієнта, а не мою «гідність»',
 'Опишіть конкретний результат, який ви даєте клієнту в грошах або часі',
 'Я створюю реальну цінність і отримую справедливу винагороду',
 11),

('selfworth',
 'Мені потрібно ще більше вчитися перед тим, як почати',
 'Мне нужно ещё больше учиться перед тем, как начать',
 'I need to learn more before I start',
 'Ще один курс, ще одна книга — тоді буду готовий',
 'Страх провалу, замаскований під прагнення до знань',
 'Дія навчає швидше за будь-який курс — я вчуся роблячи',
 'Запустіть мінімальну версію продукту або послуги цього місяця',
 'Я practitioner, що навчається через дію і реальний досвід',
 12),

-- GROWTH (зростання)
('growth',
 'Мій бізнес не може масштабуватися',
 'Мой бизнес не может масштабироваться',
 'My business cannot scale',
 'Це занадто нішево / залежить тільки від мене / ринок замалий',
 'Обмежене бачення, страх змін у моделі',
 'Будь-який бізнес масштабується — я знаходжу правильний механізм',
 'Знайдіть 3 бізнеси у своїй ніші, що масштабувались, і вивчіть їх модель',
 'Я будую бізнес-систему, що може рости без мене',
 13),

('growth',
 'Зростання означає більше стресу і менше часу',
 'Рост означает больше стресса и меньше времени',
 'Growth means more stress and less time',
 'Чим більший бізнес — тим більше проблем і менше свободи',
 'Негативний досвід або спостереження за «вічно зайнятими» підприємцями',
 'Правильне зростання дає більше свободи через системи і команду',
 'Опишіть, як виглядає ваш день при доході x3 з правильною командою',
 'Я будую бізнес, що дає свободу, а не забирає її',
 14),

('growth',
 'Інвестиції в маркетинг — це витрати, а не вкладення',
 'Инвестиции в маркетинг — это расходы, а не вложения',
 'Marketing investments are expenses, not investments',
 'Витрачати гроші на рекламу ризиковано — краще сарафанне радіо',
 'Короткострокове мислення, страх втратити гроші',
 'Маркетинг — це множник: 1 грн витрат може повернути 5 грн прибутку',
 'Вкладіть мінімальний бюджет у один канал і відстежте ROI за місяць',
 'Я інвестор у свій бізнес, що мислить категоріями повернення капіталу',
 15),

-- TIME (час)
('time',
 'У мене немає часу на стратегію — треба просто працювати',
 'У меня нет времени на стратегию — надо просто работать',
 'No time for strategy — just need to work',
 'Я занадто зайнятий операційкою щоб думати про майбутнє',
 'Пастка «зайнятого», плутанина між зайнятістю і продуктивністю',
 'Стратегія економить час — 1 година планування = 5 годин виконання',
 'Виділіть 2 години цього тижня ТІЛЬКИ на стратегію, нічого іншого',
 'Я стратег, що свідомо керує своїм часом і бізнесом',
 16),

('time',
 'Відпочинок — це розкіш, яку я поки що не можу собі дозволити',
 'Отдых — это роскошь, которую я пока не могу себе позволить',
 'Rest is a luxury I cannot afford yet',
 'Поки не досягну мети X — відпочивати рано',
 'Культ зайнятості, otoтожнення відпочинку з лінню',
 'Відновлення — це паливо для продуктивності, а не нагорода за неї',
 'Заплануйте повний вихідний цього тижня і відстежте продуктивність наступного',
 'Я продуктивний підприємець, що системно відновлюється',
 17),

('time',
 'Я повинен бути доступний 24/7 для клієнтів',
 'Я должен быть доступен 24/7 для клиентов',
 'I must be available 24/7 for clients',
 'Якщо не відповім одразу — клієнт піде',
 'Страх втратити клієнта, відсутність кордонів',
 'Чіткі межі комунікації підвищують, а не знижують довіру клієнтів',
 'Встановіть чіткий графік відповідей і повідомте клієнтів — відстежте реакцію',
 'Я підприємець з кордонами, що поважає свій час і час клієнтів',
 18),

-- RELATIONSHIPS (стосунки в бізнесі)
('relationships',
 'Я не можу довіряти партнерам — зрадять',
 'Я не могу доверять партнерам — предадут',
 'I cannot trust partners — they will betray me',
 'Бізнес-партнерство завжди закінчується конфліктом',
 'Негативний досвід або чужі історії про партнерства',
 'Правильні партнерства з чіткими угодами — прискорювач бізнесу',
 'Складіть список 3 потенційних партнерств і опишіть умови win-win',
 'Я будую сильні партнерства на основі прозорості і спільних цінностей',
 19),

('relationships',
 'Клієнти завжди будуть незадоволені — не варто намагатися',
 'Клиенты всегда будут недовольны — не стоит стараться',
 'Clients will always be dissatisfied — no point trying',
 'Не можна догодити всім, тому навіщо намагатися надпостаратися',
 'Генералізація з негативного досвіду',
 'Правильні клієнти цінують мою роботу — я фокусуюся на них',
 'Опишіть портрет ідеального клієнта і знайдіть 5 таких у своїй базі',
 'Я обираю клієнтів так само, як вони обирають мене',
 20),

('relationships',
 'Нетворкінг — це для «своїх», мене не приймуть',
 'Нетворкинг — это для «своих», меня не примут',
 'Networking is for insiders — they won''t accept me',
 'У всіх вже є зв''язки, я чужий на цьому ринку',
 'Страх відторгнення, низька самооцінка в соціальних ситуаціях',
 'Кожна людина в мережі колись прийшла як «чужий» і залишилась через цінність',
 'Познайомтеся з 3 новими людьми в профільній спільноті цього місяця',
 'Я будую мережу через цінність, яку даю, а не прошу',
 21),

-- MONEY (ставлення до грошей)
('money',
 'Гроші псують людину',
 'Деньги портят человека',
 'Money corrupts people',
 'Багаті люди — жадібні або нечесні',
 'Сімейні установки, релігійний або культурний контекст',
 'Гроші підсилюють те, ким ти вже є — добро чи зло',
 'Знайдіть 5 багатих людей, що роблять добро, і вивчіть їхній шлях',
 'Я використовую фінансову свободу для створення цінності у світі',
 22),

('money',
 'Великий дохід — це або везіння, або нечесність',
 'Большой доход — это либо везение, либо нечестность',
 'High income is either luck or dishonesty',
 'Чесним шляхом багато не заробиш',
 'Патерн бідності, знецінення чужого успіху',
 'Великий дохід — результат системного створення великої цінності',
 'Вивчіть шлях 3 підприємців у вашій ніші з доходом x10 від вашого',
 'Я системно будую цінність і отримую дохід, пропорційний їй',
 23),

('money',
 'Мені завжди буде не вистачати грошей',
 'Мне всегда будет не хватать денег',
 'I will always lack money',
 'Як тільки більше заробляю — витрати зростають так само',
 'Менталітет дефіциту, відсутність фінансової системи',
 'Фінансова безпека будується системою, а не розміром доходу',
 'Відкрийте окремий рахунок і автоматично переводьте 10% від кожного платежу',
 'Я будую фінансову систему, що зростає незалежно від обставин',
 24),

-- ADDITIONAL MIXED
('selfworth',
 'Я не лідер за природою',
 'Я не лидер по природе',
 'I am not a natural leader',
 'Лідерами народжуються, а не стають — це не моє',
 'Фіксоване мислення (fixed mindset) щодо особистих якостей',
 'Лідерство — навичка, що розвивається через практику і рефлексію',
 'Проведіть одну зустріч команди із чіткою структурою і отримайте зворотній зв''язок',
 'Я лідер, що постійно вдосконалює свій стиль управління',
 25),

('growth',
 'Онлайн — не для мого бізнесу',
 'Онлайн — не для моего бизнеса',
 'Online is not for my business',
 'Мої клієнти не в інтернеті / мій продукт не можна продавати онлайн',
 'Опір змінам, комфорт зі звичними каналами',
 'Будь-який бізнес може знайти онлайн-точки дотику з клієнтами',
 'Знайдіть 3 конкурентів з офлайн-продуктом, що успішно працюють онлайн',
 'Я відкритий до нових каналів і тестую їх без упередження',
 26),

('fear',
 'Я занадто старий / молодий для цього',
 'Я слишком старый / молодой для этого',
 'I am too old / young for this',
 'Мій вік — перешкода для успіху в бізнесі',
 'Вікова дискримінація як самообмеження',
 'Мій вік дає унікальні переваги, яких немає в інших',
 'Знайдіть 3 підприємців вашого віку, що досягли значних результатів',
 'Я підприємець, для якого вік — перевага, а не обмеження',
 27),

('delegation',
 'Я маю контролювати кожну деталь',
 'Я должен контролировать каждую деталь',
 'I must control every detail',
 'Якщо не слідкую — все піде не так',
 'Мікроменеджмент як захисна реакція на тривогу',
 'Системи і довіра дають кращий контроль, ніж ручне управління',
 'Визначте 3 процеси, де можна встановити KPI замість прямого контролю',
 'Я будую системи контролю, що масштабуються без мого прямого втручання',
 28),

('pricing',
 'Знижки — це єдиний спосіб залучити клієнтів',
 'Скидки — единственный способ привлечь клиентов',
 'Discounts are the only way to attract clients',
 'Без знижки клієнт не купить, конкуренти дешевші',
 'Відсутність унікального позиціонування, страх продавати на повну ціну',
 'Клієнти обирають цінність і довіру, а не просто ціну',
 'Проведіть продаж без знижки, апелюючи тільки до цінності результату',
 'Я продаю трансформацію, а не знижки',
 29),

('time',
 'Якщо я зупинюся — бізнес зупиниться',
 'Если я остановлюсь — бизнес остановится',
 'If I stop, the business stops',
 'Бізнес повністю залежить від мене — я не можу дозволити собі паузу',
 'Відсутність систем, страх втратити моментум',
 'Бізнес, що зупиняється без мене — не бізнес, а самозайнятість. Я будую систему.',
 'Візьміть 3 дні відпустки і подивіться, що відбудеться без вашої участі',
 'Я будую бізнес-систему, що функціонує і розвивається незалежно від мене',
 30);

-- ============================================================
-- PHASE 2 TABLES (placeholders, created but not populated)
-- ============================================================

CREATE TABLE IF NOT EXISTS wheel_scores (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sphere     sphere_key  NOT NULL,
  score      SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 10),
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wheel_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own wheel_scores" ON wheel_scores FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_wheel_user_date ON wheel_scores (user_id, date DESC);
