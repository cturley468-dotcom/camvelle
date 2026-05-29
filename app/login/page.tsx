"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f0e7]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.16),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(167,139,250,.13),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(245,240,231,.10),transparent_30%),linear-gradient(135deg,#050505,#000)]" />
        <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:96px_96px]" />
      </div>

      <header className="relative z-[9999] flex items-center justify-between px-5 py-6 md:px-10">
        <Link href="/" className="flex items-center">
          <Image
            src="/branding/camvelle-logo.png"
            alt="CamVelle Creative"
            width={420}
            height={120}
            priority
            unoptimized
            className="h-12 w-auto object-contain md:h-16 lg:h-20 xl:h-24"
          />
        </Link>

        <details className="relative z-[99999]">
          <summary className="list-none cursor-pointer rounded-full bg-[#f5f0e7] px-7 py-4 text-xs font-black uppercase tracking-[0.35em] text-black [&::-webkit-details-marker]:hidden">
            Menu
          </summary>

          <div className="absolute right-0 top-16 z-[99999] w-72 rounded-[2rem] border border-white/15 bg-black/95 p-6 shadow-[0_0_80px_rgba(255,255,255,.18)] backdrop-blur-2xl">
            <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              <Link href="/galleries">Galleries</Link>
              <Link href="/services">Services</Link>
              <a href="/#book">Book</a>
              <Link href="/login">Studio Login</Link>
            </nav>
          </div>
        </details>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-112px)] items-center justify-center px-5 pb-10 pt-4 md:px-10 md:pb-16">
        <div className="w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-white/[0.035] px-6 py-8 text-center shadow-[0_0_90px_rgba(255,255,255,.08)] backdrop-blur-2xl sm:px-8 md:rounded-[3rem] md:px-12 md:py-12">
          <p className="text-[10px] uppercase tracking-[0.45em] text-white/35 md:text-[11px]">
            Camvelle Creative
          </p>

          <h1 className="mt-5 text-5xl font-light leading-none tracking-[-0.08em] md:text-7xl">
            Enter Studio
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
            Access bookings, galleries, uploads, schedules, and more.
          </p>

          <form onSubmit={handleLogin} className="mt-9 space-y-4 text-left md:mt-10">
            <div className="flex items-center gap-4 rounded-full border border-white/15 bg-white/[0.04] px-5 py-4 md:px-6">
              <label className="min-w-20 text-[10px] uppercase tracking-[0.32em] text-white/35">
                Email
              </label>

              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/25 md:text-lg"
              />
            </div>

            <div className="flex items-center gap-4 rounded-full border border-white/15 bg-white/[0.04] px-5 py-4 md:px-6">
              <label className="min-w-20 text-[10px] uppercase tracking-[0.32em] text-white/35">
                Password
              </label>

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/25 md:text-lg"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 text-white/45 transition hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#f5f0e7] px-8 py-5 text-[11px] font-black uppercase tracking-[0.35em] text-black shadow-[0_0_45px_rgba(245,240,231,.16)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking..." : "Enter Studio"}
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase tracking-[0.28em] text-white/40">
            <Link href="/galleries" className="transition hover:text-white">
              Galleries
            </Link>
            <Link href="/services" className="transition hover:text-white">
              Services
            </Link>
            <a href="/#book" className="transition hover:text-white">
              Book
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
