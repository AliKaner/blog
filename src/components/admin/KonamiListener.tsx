"use client";

import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { useKonamiCode } from "@/hooks/useKonamiCode";

const ADMIN_TRIGGER = "flbl";

export function KonamiListener() {
  const { isAdmin, openLogin } = useAdminSession();
  useKonamiCode(ADMIN_TRIGGER, openLogin, !isAdmin);
  return null;
}
