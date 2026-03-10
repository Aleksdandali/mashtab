-- ============================================================
-- 003: Auth & Security Fixes
-- ============================================================

-- 1. Improve profile trigger to populate fields from auth metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (
    id, name, language, onboarding_done, subscription_tier,
    ai_messages_today, ai_messages_date,
    morning_reminder, evening_reminder, weekly_checkin_day,
    theme_mode, created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'uk',
    FALSE,
    'free',
    0,
    CURRENT_DATE,
    '08:00:00',
    '20:00:00',
    0,
    'auto',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 2. Fix RLS: add WITH CHECK to all user-owned tables
-- Without WITH CHECK, users can INSERT rows with arbitrary user_id

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'diagnostic_answers',
    'user_beliefs',
    'journal_entries',
    'ai_conversations',
    'goals',
    'tasks'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users own %s" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "Users own %s" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      t, t
    );
  END LOOP;
END $$;

-- wheel_scores too
DROP POLICY IF EXISTS "Users own wheel_scores" ON wheel_scores;
CREATE POLICY "Users own wheel_scores"
  ON wheel_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles: add INSERT policy (trigger runs as SECURITY DEFINER, but just in case)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles: add WITH CHECK to update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- 3. Account deletion function (called from edge function)
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM ai_conversations WHERE user_id = target_user_id;
  DELETE FROM journal_entries  WHERE user_id = target_user_id;
  DELETE FROM tasks            WHERE user_id = target_user_id;
  DELETE FROM goals            WHERE user_id = target_user_id;
  DELETE FROM user_beliefs     WHERE user_id = target_user_id;
  DELETE FROM diagnostic_answers WHERE user_id = target_user_id;
  DELETE FROM wheel_scores     WHERE user_id = target_user_id;
  DELETE FROM profiles         WHERE id = target_user_id;
END;
$$;
