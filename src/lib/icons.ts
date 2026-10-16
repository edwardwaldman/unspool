// Icon names the script writer may use in reel visuals (rendered with Lucide). Kept short and concrete.
export const ICON_NAMES = [
  "book-open", "graduation-cap", "school", "flask", "microscope", "atom", "dna", "brain", "lightbulb", "puzzle",
  "calculator", "sigma", "percent", "equal", "divide", "hash", "ruler", "dice", "shuffle", "repeat", "filter", "split",
  "chart-bar", "chart-line", "chart-pie", "trending-up", "trending-down", "grid", "layers", "database", "cpu", "code",
  "scale", "gavel", "landmark", "vote", "file-text", "signature", "scroll", "clipboard", "list-checks", "quote",
  "briefcase", "building", "factory", "store", "cart", "package", "truck", "handshake",
  "banknote", "wallet", "card", "receipt", "piggy-bank", "coins", "dollar",
  "calendar", "deadline", "clock", "timer", "hourglass",
  "alert", "shield-alert", "shield-check", "shield", "check", "x", "ban", "lock", "key", "eye", "search", "help",
  "target", "flag", "award", "trophy", "star", "map", "compass", "globe", "mountain", "waves", "leaf", "sprout",
  "sun", "droplet", "flame", "zap", "users", "user", "user-check", "house", "heart-pulse", "stethoscope", "pill",
  "soup", "cooking-pot", "utensils", "chef", "mail", "message", "megaphone", "newspaper", "camera", "music",
  "palette", "car", "plane", "hammer", "wrench", "arrows", "infinity", "undo",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
