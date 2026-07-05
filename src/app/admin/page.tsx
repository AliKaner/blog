"use client";

import Link from "next/link";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";

const SECTIONS = [
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/resume", label: "Experience & Education" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/movies", label: "Movies" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/dev-log", label: "Dev Log" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/custom-pets", label: "Custom Pets" },
];

export default function AdminDashboardPage() {
  const { logout } = useAdminSession();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-ink">Admin</h1>
        <button onClick={logout} className="text-sm text-ink-soft hover:text-ink">
          Log out
        </button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="panel px-4 py-6 text-center font-heading text-lg text-ink no-underline"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
