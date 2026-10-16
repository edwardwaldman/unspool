import {
  Atom, Award, Ban, Banknote, BookOpen, Brain, Briefcase, Building2, Calculator, Calendar, CalendarClock, Camera, Car,
  ChartBar, ChartLine, ChartPie, ChefHat, CircleCheck, CircleHelp, CircleX, ClipboardList, Clock, Code, Coins, Compass,
  CookingPot, Cpu, CreditCard, Database, Dices, Divide, Dna, Droplet, Equal, Eye, Factory, FileText, Filter, Flag, Flame,
  FlaskConical, Gavel, Globe, GraduationCap, Grid3x3, Hammer, Handshake, Hash, HeartPulse, Hourglass, House, Infinity as InfinityIcon,
  Key, Landmark, Layers, Leaf, Lightbulb, ListChecks, Lock, Mail, Megaphone, MessageSquare, Microscope, Mountain, Music,
  Newspaper, Package, Palette, Percent, PiggyBank, Pill, Plane, Puzzle, Quote, Receipt, Repeat, Ruler, Scale, School,
  ScrollText, Search, Shield, ShieldAlert, ShieldCheck, ShoppingCart, Shuffle, Sigma, Signature, Soup, Split, Sprout, Star,
  Stethoscope, Store, Sun, Target, Timer, TrendingDown, TrendingUp, TriangleAlert, Trophy, Truck, Undo2, User, UserCheck,
  Users, Utensils, Vote, Wallet, Waves, Wrench, Zap, ArrowRightLeft, BadgeDollarSign, type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/lib/icons";

const MAP: Record<IconName, LucideIcon> = {
  "book-open": BookOpen, "graduation-cap": GraduationCap, school: School, flask: FlaskConical, microscope: Microscope,
  atom: Atom, dna: Dna, brain: Brain, lightbulb: Lightbulb, puzzle: Puzzle, calculator: Calculator, sigma: Sigma,
  percent: Percent, equal: Equal, divide: Divide, hash: Hash, ruler: Ruler, dice: Dices, shuffle: Shuffle, repeat: Repeat,
  filter: Filter, split: Split, "chart-bar": ChartBar, "chart-line": ChartLine, "chart-pie": ChartPie,
  "trending-up": TrendingUp, "trending-down": TrendingDown, grid: Grid3x3, layers: Layers, database: Database, cpu: Cpu,
  code: Code, scale: Scale, gavel: Gavel, landmark: Landmark, vote: Vote, "file-text": FileText, signature: Signature,
  scroll: ScrollText, clipboard: ClipboardList, "list-checks": ListChecks, quote: Quote, briefcase: Briefcase,
  building: Building2, factory: Factory, store: Store, cart: ShoppingCart, package: Package, truck: Truck,
  handshake: Handshake, banknote: Banknote, wallet: Wallet, card: CreditCard, receipt: Receipt, "piggy-bank": PiggyBank,
  coins: Coins, dollar: BadgeDollarSign, calendar: Calendar, deadline: CalendarClock, clock: Clock, timer: Timer,
  hourglass: Hourglass, alert: TriangleAlert, "shield-alert": ShieldAlert, "shield-check": ShieldCheck, shield: Shield,
  check: CircleCheck, x: CircleX, ban: Ban, lock: Lock, key: Key, eye: Eye, search: Search, help: CircleHelp,
  target: Target, flag: Flag, award: Award, trophy: Trophy, star: Star, map: Compass, compass: Compass, globe: Globe,
  mountain: Mountain, waves: Waves, leaf: Leaf, sprout: Sprout, sun: Sun, droplet: Droplet, flame: Flame, zap: Zap,
  users: Users, user: User, "user-check": UserCheck, house: House, "heart-pulse": HeartPulse, stethoscope: Stethoscope,
  pill: Pill, soup: Soup, "cooking-pot": CookingPot, utensils: Utensils, chef: ChefHat, mail: Mail,
  message: MessageSquare, megaphone: Megaphone, newspaper: Newspaper, camera: Camera, music: Music, palette: Palette,
  car: Car, plane: Plane, hammer: Hammer, wrench: Wrench, arrows: ArrowRightLeft, infinity: InfinityIcon, undo: Undo2,
};

/** A Lucide icon by its script name; unknown names fall back to a neutral mark. */
export function ReelIcon({ name, size = 40, strokeWidth = 1.25, className }: { name: string; size?: number; strokeWidth?: number; className?: string }) {
  const Cmp = MAP[name as IconName] ?? Lightbulb;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
