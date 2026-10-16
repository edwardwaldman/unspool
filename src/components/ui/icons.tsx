// UI icons: Lucide, thin strokes, one place to swap them.
import {
  ChevronDown as LChevronDown,
  ChevronUp as LChevronUp,
  Heart,
  House,
  LayoutGrid,
  Lock,
  Menu,
  MessageCircle,
  Play,
  Plus,
  Repeat2,
  Send,
  SlidersHorizontal,
  SquarePlay,
  Trash2,
  Upload,
  User,
  Volume2,
  VolumeX,
  X,
  type LucideProps,
} from "lucide-react";

type P = LucideProps & { size?: number; filled?: boolean };
const sw = 1.5;

export const HeartIcon = ({ filled, ...p }: P) => <Heart strokeWidth={sw} fill={filled ? "currentColor" : "none"} {...p} />;
export const ChatIcon = (p: P) => <MessageCircle strokeWidth={sw} {...p} />;
export const ReplayIcon = (p: P) => <Repeat2 strokeWidth={sw} {...p} />;
export const ShareIcon = (p: P) => <Send strokeWidth={sw} {...p} />;
export const MoreIcon = (p: P) => <Menu strokeWidth={sw} {...p} />;
export const FilterIcon = (p: P) => <SlidersHorizontal strokeWidth={sw} {...p} />;
export const HomeIcon = ({ filled, ...p }: P) => <House strokeWidth={filled ? 2 : sw} {...p} />;
export const ReelsIcon = ({ filled, ...p }: P) => <SquarePlay strokeWidth={filled ? 2 : sw} {...p} />;
export const PlusIcon = (p: P) => <Plus strokeWidth={1.75} {...p} />;
export const GridIcon = ({ filled, ...p }: P) => <LayoutGrid strokeWidth={filled ? 2 : sw} {...p} />;
export const UserIcon = ({ filled, ...p }: P) => <User strokeWidth={filled ? 2 : sw} {...p} />;
export const ChevronUp = (p: P) => <LChevronUp strokeWidth={sw} {...p} />;
export const ChevronDown = (p: P) => <LChevronDown strokeWidth={sw} {...p} />;
export const LockIcon = (p: P) => <Lock strokeWidth={sw} {...p} />;
export const VolumeIcon = ({ muted, ...p }: P & { muted?: boolean }) =>
  muted ? <VolumeX strokeWidth={sw} {...p} /> : <Volume2 strokeWidth={sw} {...p} />;
export const PlayIcon = (p: P) => <Play strokeWidth={sw} fill="currentColor" {...p} />;
export const CloseIcon = (p: P) => <X strokeWidth={sw} {...p} />;
export const TrashIcon = (p: P) => <Trash2 strokeWidth={sw} {...p} />;
export const UploadIcon = (p: P) => <Upload strokeWidth={sw} {...p} />;

/** The Unspool mark: a spool with its thread running out. Drawn SVG, theme colors. */
export function SpoolMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="10" r="7" stroke="var(--thread)" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3" stroke="var(--thread)" strokeWidth="1.5" />
      <path d="M12 17c3.5 2.6 7 2.6 10.5 0.6" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <SpoolMark size={size * 0.85} />
      <span className="font-display leading-none" style={{ fontSize: size }}>
        Unspool
      </span>
    </span>
  );
}
