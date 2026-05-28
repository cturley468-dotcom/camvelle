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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_26%)]" />
        <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.92))]" />
      </div>

      {/* HEADER */}
      <header className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
          <Link href="/" className="flex items-center">
            <Image
              src="/branding/camvelle-logo.png"
              alt="CamVelle Creative"
              width={420}
              height={120}
              priority
              unoptimized
              className="h-12 w-auto object-contain md:h-16 lg:h-20"
            />
          </Link>

          <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55 md:flex">
            <Link
              href="/portfolio"
              className="transition hover:text-white"
            >
              Portfolio
            </Link>

            <Link
              href="/services"
              className="transition hover:text-white"
            >
              Services
            </Link>

            <Link
              href="/book"
              className="transition hover:text-white"
            >
              Book
            </Link>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <section className="relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-5 py-16 md:px-10">
        <div className="w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl md:p-14">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
              CamVelle Creative
            </p>

            <h1 className="mt-6 text-5xl font-light leading-none tracking-[-0.08em] md:text-7xl">
              Enter
              <br />
              Studio
            </h1>

            <p className="mt-8 max-w-lg text-lg leading-8 text-white/55">
              Access bookings, galleries, uploads, schedules, and client
              management inside your creative dashboard.
            </p>
          </div>

          {/* LOGIN FORM */}
          <form
            onSubmit={handleLogin}
            className="mt-14 space-y-6"
          >
            {/* EMAIL */}
            <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.04] px-6 py-5">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/35">
                Email
              </label>

              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
              />
            </div>

            {/* PASSWORD */}
            <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.04] px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-[0.32em] text-white/35">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45 transition hover:text-white"
                >
                  {showPassword ? (
                    <>
                      <EyeOff size={14} />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      Show
                    </>
                  )}
                </button>
              </div>

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-full bg-[#f5f0e7] px-8 py-6 text-[12px] font-semibold uppercase tracking-[0.35em] text-black transition duration-300 hover:scale-[1.01] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking..." : "Enter Studio"}
            </button>
          </form>

          {/* FOOTER LINKS */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-[11px] uppercase tracking-[0.3em] text-white/40">
            <Link
              href="/portfolio"
              className="transition hover:text-white"
            >
              Portfolio
            </Link>

            <Link
              href="/services"
              className="transition hover:text-white"
            >
              Services
            </Link>

            <Link
              href="/book"
              className="transition hover:text-white"
            >
              Book
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
