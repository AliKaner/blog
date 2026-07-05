"use client";

import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AdminGate({ children }: { children: ReactNode }) {
  const { isAdmin, hydrated } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for localStorage hydration before deciding — otherwise a fresh
    // page load always redirects a real admin home, since isAdmin starts
    // false until the session is read.
    if (hydrated && !isAdmin) router.replace("/");
  }, [hydrated, isAdmin, router]);

  if (!hydrated || !isAdmin) return null;
  return <>{children}</>;
}
