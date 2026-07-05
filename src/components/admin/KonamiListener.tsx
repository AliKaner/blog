"use client";

import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const ADMIN_TRIGGER = "flbl";

export function KonamiListener() {
  const { isAdmin, openLogin } = useAdminSession();
  const router = useRouter();

  const onTrigger = useCallback(() => {
    if (isAdmin) {
      router.push("/admin");
    } else {
      openLogin();
    }
  }, [isAdmin, router, openLogin]);

  useKonamiCode(ADMIN_TRIGGER, onTrigger);
  return null;
}
