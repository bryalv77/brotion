import { Image, Text } from "react-native";
import {
  Book, Briefcase, Calendar, Camera, Code, Coffee, Compass, Database, FileText, Flag, Folder,
  Globe, Heart, Home, Image as ImageIcon, Inbox, Lightbulb, Link, Lock, Mail, Map, Music,
  Rocket, Settings, ShoppingCart, Star, Target, Terminal, Users, Zap, type LucideIcon,
} from "lucide-react-native";
import { PageGlyph } from "@/components/ui";
import { colors } from "@/lib/theme";

/** Icon string formats: emoji ("🚀"), "lucide:Name", or an http(s)/data image URL. */
export const LUCIDE_ICONS: Record<string, LucideIcon> = {
  Book, Briefcase, Calendar, Camera, Code, Coffee, Compass, Database, FileText, Flag, Folder,
  Globe, Heart, Home, Image: ImageIcon, Inbox, Lightbulb, Link, Lock, Mail, Map, Music,
  Rocket, Settings, ShoppingCart, Star, Target, Terminal, Users, Zap,
};

const isImage = (s: string) => /^(https?:|data:image\/)/.test(s);

export function PageIcon({ icon, size = 16 }: { icon?: string | null; size?: number }) {
  if (!icon) return <PageGlyph size={size} />;
  if (isImage(icon)) {
    return <Image source={{ uri: icon }} style={{ width: size, height: size, borderRadius: 3 }} />;
  }
  if (icon.startsWith("lucide:")) {
    const Lucide = LUCIDE_ICONS[icon.slice(7)];
    return Lucide ? <Lucide size={size} strokeWidth={1.5} color={colors.ink} /> : <PageGlyph size={size} />;
  }
  return <Text style={{ fontSize: size * 0.9 }}>{icon}</Text>;
}
