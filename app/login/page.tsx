"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  CamvelleBody,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleInnerPanel,
  CamvellePageShell,
  CamvellePanel,
  camvelleCreamButton,
} from "../components/CamvelleUI";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

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
    <CamvellePageShell>
      <header className="relative z-[9999] mb-10 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/branding/camvelle-logo.png"
            alt="Camvelle Creative"
            width={420}
            height={120}
            priority
            unoptimized
            className="h-14 w-auto object-contain sm:h-16 md:h-20"
          />
        </Link>

        <details className="relative z-[99999]">
          <summary
            className={`${camvelleCreamButton} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}
          >
            Menu
          </summary>

          <div className="absolute right-0 top-16 z-[99999] w-80 rounded-[3rem] border border-white/10 bg-black/80 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
            <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-[0.32em] text-white/70">
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

              <Link href="/status" className="hover:text-white">
                Client Status
              </Link>

              <Link href="/login" className="text-white">
                Studio Login
              </Link>
            </nav>
          </div>
        </details>
      </header>

      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center pb-14">
        <CamvellePanel className="w-full max-w-xl p-8 text-center sm:p-10 md:p-12">
          <CamvelleEyebrow>Camvelle Creative</CamvelleEyebrow>

          <CamvelleHeading>
            Studio
            <br />
            Login
          </CamvelleHeading>

          <CamvelleBody>
            Access bookings, galleries, uploads, schedules, contracts, invoices,
            and client records.
          </CamvelleBody>

          <form onSubmit={handleLogin} className="mt-10 space-y-5 text-left">
            <CamvelleInnerPanel className="flex items-center gap-4 px-6 py-4">
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
            </CamvelleInnerPanel>

            <CamvelleInnerPanel className="flex items-center gap-4 px-6 py-4">
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
                onClick={() => setShowPassword((current) => !current)}
                className="shrink-0 text-white/45 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </CamvelleInnerPanel>

            {error && (
              <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm leading-7 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`${camvelleCreamButton} w-full disabled:cursor-not-allowed disabled:opacity-60`}
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

            <Link href="/status" className="transition hover:text-white">
              Status
            </Link>
          </div>
        </CamvellePanel>
      </section>
    </CamvellePageShell>
  );
}
