"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useState } from "react";

export default function BookPage() {
  const [success, setSuccess] = useState("");

  async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const formElement = e.currentTarget;
  const formData = new FormData(formElement);

  setSuccess("");

  const { error } = await supabase.from("inquiries").insert({
    full_name: String(formData.get("full_name")),
    email: String(formData.get("email")),
    phone: String(formData.get("phone")),
    service_type: String(formData.get("service_type")),
    preferred_date: String(formData.get("preferred_date")) || null,
    message: String(formData.get("message")),
    status: "new",
  });

  if (error) {
    alert(error.message);
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
          <summary className="list-none cursor-pointer rounded-full border border-white/10 bg-[#f5f0e7] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02]">
            Menu
          </summary>

          <div className="absolute right-0 top-16 w-72 rounded-[3rem] border border-white/10 bg-black/80 p-6 backdrop-blur-2xl">
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

              <Link href="/book" className="text-white">
                Book
              </Link>

              <Link href="/login" className="hover:text-white">
                Studio Login
              </Link>
            </nav>
          </div>
        </details>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-6 pb-10 pt-10 md:px-10 md:pb-16 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
            BOOK A SESSION
          </p>

          <h1 className="mt-8 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#f5f1e8] md:text-7xl lg:text-[7rem]">
            Let’s create
            <br />
            something timeless.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-9 text-white/50 md:text-xl">
            Tell me about your vision, your story, and the experience you want
            to create. Every session begins with intention.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section className="relative z-10 px-6 pb-28 md:px-10">
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-14">
          <div className="mb-14">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
              SESSION INQUIRY
            </p>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.06em] md:text-6xl">
              Tell me about
              <br />
              your vision.
            </h2>
          </div>

          <form onSubmit={handleBooking} className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/35">
                Full Name
              </label>

              <input
                required
                type="text"
                placeholder="Your name"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
              />
            </div>

            <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/35">
                Email
              </label>

              <input
                required
                type="email"
                placeholder="Your email"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
              />
            </div>

            <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/35">
                Phone
              </label>

              <input
                type="tel"
                placeholder="Phone number"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
              />
            </div>

            <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/35">
                Session Type
              </label>

              <select className="w-full bg-transparent text-lg text-white outline-none">
                <option className="bg-black">Proposal</option>
                <option className="bg-black">Couples</option>
                <option className="bg-black">Families</option>
                <option className="bg-black">Portraits</option>
                <option className="bg-black">Business</option>
                <option className="bg-black">Real Estate</option>
                <option className="bg-black">Automotive</option>
                <option className="bg-black">Events</option>
              </select>
            </div>

            <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:col-span-2">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/35">
                Project Details
              </label>

              <textarea
                rows={7}
                placeholder="Tell me about your vision, date, location, ideas, or anything important..."
                className="w-full resize-none bg-transparent text-lg text-white outline-none placeholder:text-white/25"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-full bg-[#f5f0e7] px-10 py-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.01] hover:bg-white"
              >
                Submit Inquiry
              </button>
            </div>

            {success && (
              <div className="md:col-span-2">
                <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] px-6 py-5 text-center text-sm tracking-[0.15em] text-white/65 backdrop-blur-xl">
                  {success}
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
