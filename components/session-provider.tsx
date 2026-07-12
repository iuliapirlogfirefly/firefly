"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SessionInfo } from "@/types/events";

const guestSession: SessionInfo = {
  userId: null,
  role: "guest",
  email: null,
  displayName: null,
  preferredLocale: "en",
  businessAccountId: null,
  isSuspended: false,
};

const SessionContext = createContext<SessionInfo>(guestSession);

type Props = {
  initialSession: SessionInfo;
  children: ReactNode;
};

export function SessionProvider({ initialSession, children }: Props) {
  const [session, setSession] = useState(initialSession);
  const router = useRouter();

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
