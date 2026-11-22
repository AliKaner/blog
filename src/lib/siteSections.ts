import {
  Amphora,
  BookOpen,
  Clapperboard,
  Compass,
  Component,
  FileText,
  FolderKanban,
  Home,
  MapPin,
  Martini,
  Newspaper,
  Pencil,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export type SiteSection = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Every top-level section, in nav-rail order. */
export const SITE_SECTIONS: SiteSection[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/journey", label: "Journey", icon: Compass },
  { href: "/cv", label: "CV", icon: FileText },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/components", label: "Components", icon: Component },
  { href: "/drawings", label: "Drawings", icon: Pencil },
  // Tutorials is hidden from the nav for now; the pages stay reachable.
  // { href: "/tutorials", label: "Tutorials", icon: GraduationCap },
  { href: "/movies", label: "Movies", icon: Clapperboard },
  { href: "/cocktails", label: "Cocktails", icon: Martini },
  { href: "/places", label: "Places", icon: MapPin },
  { href: "/books", label: "Books", icon: BookOpen },
  { href: "/dev-log", label: "Dev Log", icon: Terminal },
  { href: "/posts", label: "Posts", icon: Newspaper },
  { href: "/keepsakes", label: "Keepsakes", icon: Amphora },
];
