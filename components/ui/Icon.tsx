/**
 * Central icon router — maps string name → Lucide component.
 * Always stroke-only, 1.5px stroke-width.
 * Usage: <Icon name="Coins" size={24} color={C.text} />
 */
import {
  Coins, Target, Shield, Zap, TrendingUp, Clock, BookOpen, Users, Monitor,
  Heart, AlertTriangle, Brain, Search, Microscope, Scale, RefreshCw,
  PlayCircle, Sparkles, Sunrise, Moon, MessageCircle, LayoutDashboard,
  Activity, CheckCircle2, ChevronRight, ChevronLeft, Plus, Lock, ArrowRight,
  Check, BarChart2, Star, Flame, Award, Briefcase, DollarSign, Smile,
  Home, Lightbulb, LucideProps, X, Settings, Globe, Sun, SunMoon, Bell,
  Calendar, CircleDot, Minus, MoreHorizontal, Edit2, Trash2, ArrowUpCircle,
  CircleCheck, TrendingDown, Wallet, HandHelping, ShieldAlert, Send, Mail,
  MessageSquare,
} from 'lucide-react-native';

const ICON_MAP = {
  // Categories
  Coins,
  Target,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  BookOpen,
  Users,
  Monitor,
  Heart,
  AlertTriangle,
  Brain,
  ShieldAlert,
  Award,
  Wallet,
  DollarSign,
  HandHelping,

  // Stages
  Search,
  Microscope,
  Scale,
  RefreshCw,
  PlayCircle,
  Sparkles,

  // Rituals
  Sunrise,
  Moon,

  // Spheres
  Briefcase,
  Smile,
  Home,
  Activity,

  // UI
  MessageCircle,
  LayoutDashboard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Lock,
  ArrowRight,
  Check,
  BarChart2,
  Star,
  Flame,
  Lightbulb,
  X,
  Settings,
  Globe,
  Sun,
  SunMoon,
  Bell,
  Calendar,
  CircleDot,
  Minus,
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowUpCircle,
  CircleCheck,
  Send,
  Mail,
  MessageSquare,
} as const;

export type IconName = keyof typeof ICON_MAP;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = '#F9FAFF', strokeWidth = 1.5, ...rest }: IconProps) {
  const LucideIcon = ICON_MAP[name] as React.ComponentType<LucideProps>;
  if (!LucideIcon) return null;
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}
