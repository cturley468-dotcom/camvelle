"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkDashboardAccess();
  }, []);

  async function checkDashboardAccess() {
    setChecking(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setAllowed(false);
      setChecking(false);
      router.replace("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setAllowed(false);
      setChecking(false);
      router.replace("/login");
      return;
    }

    const role = String(profile.role || "").toLowerCase();

    const isAdmin = role === "admin" || role === "owner";

    if (!isAdmin) {
      setAllowed(false);
      setChecking(false);
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    setAllowed(true);
    setChecking(false);
  }

  if (checking) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020202] px-6 text-[#f5f1e8]">
        <div className="pointer-events-none fixed inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/backgrounds/camvelle-background.png')",
            }}
          />

          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative z-10 w-full max-w-xl rounded-[3rem] border border-white/10 bg-black/60 p-10 text-center shadow-[inset_0_0_60px_rgba(255,255,255,0.025)] backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
            Camvelle Security
          </p>

          <h1 className="mt-7 text-5xl font-light tracking-[-0.08em]">
            Checking access.
          </h1>

          <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-white/45">
            Verifying your account before opening the dashboard.
          </p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
