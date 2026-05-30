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
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/backgrounds/camvelle-background.png')",
          }}
        />

        <div className="absolute inset-0 bg-black/40" />

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>

      {/* HEADER */}
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
          <summary className="list-none cursor-pointer rounded-full border border-white/10 bg-[#f5f0e7] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02] [&::-webkit-details-marker]:hidden">
            Menu
          </summary>

          <div className="absolute right-0 top-16 z-[99999] w-72 rounded-[3rem] border border-white/10 bg-black/80 p-6 backdrop-blur-2xl">
            <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-[0.3em] text-white/75">
              <Link href="/" className="hover:text-white">
                Home
              </Link>

              <Link href="/galleries" className="hover:text-white">
                Galleries
              </Link>

              <Link href="/services" className="hover:text-white">
                Services
              </Link>

              <Link href="/book" className="hover:text-white">
                Book
              </Link>

              <Link href="/login" className="text-white">
                Studio Login
              </Link>
            </nav>
          </div>
        </details>
      </header>

      {/* LOGIN */}
      <section className="relative z-10 flex min-h-[calc(100vh-112px)] items-center justify-center px-5 pb-14 pt-6 md:px-10 md:pb-20">
        <div className="w-full max-w-2xl rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-center backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-14">
          <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
            Camvelle Creative
          </p>

          <h1 className="mt-8 text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#f5f1e8] md:text-7xl">
            Enter
            <br />
            Studio.
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-white/50">
            Access bookings, galleries, uploads, schedules, and creative
            management.
          </p>

          <form onSubmit={handleLogin} className="mt-12 space-y-5 text-left">
            <div className="flex items-center gap-4 rounded-[3rem] border border-white/10 bg-white/[0.035] px-6 py-5 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <label className="min-w-24 text-[11px] uppercase tracking-[0.32em] text-white/35">
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

            <div className="flex items-center gap-4 rounded-[3rem] border border-white/10 bg-white/[0.035] px-6 py-5 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <label className="min-w-24 text-[11px] uppercase tracking-[0.32em] text-white/35">
                Password
              </label>

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
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
              <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#f5f0e7] px-10 py-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.01] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking..." : "Enter Studio"}
            </button>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-7 text-[11px] uppercase tracking-[0.3em] text-white/40">
            <Link href="/galleries" className="transition hover:text-white">
              Galleries
            </Link>

            <Link href="/services" className="transition hover:text-white">
              Services
            </Link>

            <Link href="/book" className="transition hover:text-white">
              Book
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
