"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BookPage() {
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const preferredDate = formData.get("preferred_date");

    setSuccess("");
    setErrorMessage("");
    setSending(true);

    const { error } = await supabase.from("inquiries").insert({
      full_name: String(formData.get("full_name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      service_type: String(formData.get("service_type") || ""),
      preferred_date: preferredDate ? String(preferredDate) : null,
      message: String(formData.get("message") || ""),
      status: "new",
    });

    setSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    formElement.reset();
    setSuccess("Booking request submitted. I’ll follow up soon.");
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
          <img
            src="/branding/camvelle-logo.png"
            alt="CamVelle Creative"
            className="h-12 w-auto object-contain md:h-16 lg:h-20 xl:h-24"
          />
        </Link>

        <details className="relative z-[99999]">
          <summary className="list-none cursor-pointer rounded-full border border-white/10 bg-[#f5f0e7] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02] [&::-webkit-details-marker]:hidden">
            Menu
          </summary>

          <div className="absolute right-0 top-16 z-[99999] w-72 rounded-[3rem] border border-white/10 bg-black/80 p-6 backdrop-blur-2xl">
            <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-[0.3em] text-white/75">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/galleries" className="hover:text-white">Galleries</Link>
              <Link href="/services" className="hover:text-white">Services</Link>
              <Link href="/book" className="text-white">Book</Link>
              <Link href="/login" className="hover:text-white">Studio Login</Link>
            </nav>
          </div>
        </details>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-2 pb-10 pt-6 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-center transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-14">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Book A Session
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Let’s create
              <br />
              something timeless.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              Tell me about your vision, your story, and the moment you want to
              preserve. Every session begins with intention.
            </p>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="relative z-10 px-2 pb-28 md:px-10">
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
          <div className="mb-12">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Session Inquiry
            </p>

            <h2 className="mt-6 text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-6xl">
              Tell me about
              <br />
              your vision.
            </h2>
          </div>

          <form onSubmit={handleBooking} className="grid gap-5 md:grid-cols-2">
            <Field label="Full Name">
              <input
                required
                name="full_name"
                type="text"
                placeholder="Your name"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/20"
              />
            </Field>

            <Field label="Email">
              <input
                required
                name="email"
                type="email"
                placeholder="Your email"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/20"
              />
            </Field>

            <Field label="Phone">
              <input
                name="phone"
                type="tel"
                placeholder="Phone number"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/20"
              />
            </Field>

            <Field label="Preferred Date">
              <input
                name="preferred_date"
                type="date"
                className="w-full bg-transparent text-lg text-white outline-none"
              />
            </Field>

            <Field label="Session Type">
              <select
                name="service_type"
                className="w-full bg-transparent text-lg text-white outline-none"
                defaultValue="Proposal"
              >
                <option className="bg-black">Proposal</option>
                <option className="bg-black">Couples</option>
                <option className="bg-black">Families</option>
                <option className="bg-black">Portraits</option>
                <option className="bg-black">Business</option>
                <option className="bg-black">Real Estate</option>
                <option className="bg-black">Automotive</option>
                <option className="bg-black">Events</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Project Details">
                <textarea
                  name="message"
                  rows={7}
                  placeholder="Tell me about your vision, location, ideas, or anything important..."
                  className="w-full resize-none bg-transparent text-lg text-white outline-none placeholder:text-white/20"
                />
              </Field>
            </div>

            {errorMessage && (
              <div className="md:col-span-2 rounded-[2rem] border border-red-400/20 bg-red-500/10 p-5 text-red-200">
                {errorMessage}
              </div>
            )}

            {success && (
              <div className="md:col-span-2 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 text-center text-white/65">
                {success}
              </div>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-[#f5f0e7] px-10 py-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.01] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Submitting..." : "Submit Inquiry"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
      <label className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/35">
        {label}
      </label>

      {children}
    </div>
  );
}
