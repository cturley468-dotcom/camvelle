"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  CamvelleBody,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleInnerPanel,
  CamvellePageShell,
  CamvellePanel,
  camvelleCreamButton,
  camvelleGhostButton,
} from "../components/CamvelleUI";

export default function BookPage() {
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleBooking(e: FormEvent<HTMLFormElement>) {
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

    if (error) {
      setSending(false);
      setErrorMessage(error.message);
      return;
    }

    try {
      await fetch("/api/bookings/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: formData.get("full_name"),
          clientEmail: formData.get("email"),
          clientPhone: formData.get("phone"),
          sessionType: formData.get("service_type"),
          preferredDate: formData.get("preferred_date"),
          preferredTime: "",
          location: "",
          details: formData.get("message"),
        }),
      });
    } catch (notifyError) {
      console.error("Booking notification email failed:", notifyError);
    }

    setSending(false);
    formElement.reset();
    setSuccess("Booking request submitted. I’ll follow up soon.");
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

              <Link href="/book" className="text-white">
                Book
              </Link>

              <Link href="/status" className="hover:text-white">
                Client Status
              </Link>

              <Link href="/login" className="hover:text-white">
                Studio Login
              </Link>
            </nav>
          </div>
        </details>
      </header>

      <CamvellePanel className="p-8 text-center sm:p-10 md:p-14">
        <CamvelleEyebrow>Book A Session</CamvelleEyebrow>

        <CamvelleHeading>
          Let’s create
          <br />
          something timeless.
        </CamvelleHeading>

        <CamvelleBody>
          Tell me about your vision, your story, and the moment you want to
          preserve. Every session begins with intention.
        </CamvelleBody>
      </CamvellePanel>

      <CamvellePanel className="mt-8 p-7 sm:p-10 md:p-12">
        <div className="mb-10">
          <CamvelleEyebrow>Session Inquiry</CamvelleEyebrow>

          <h2 className="mt-6 text-5xl font-light leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
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
            <div className="md:col-span-2 rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-5 text-center text-emerald-100">
              {success}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={sending}
              className={`${camvelleCreamButton} w-full disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {sending ? "Submitting..." : "Submit Inquiry"}
            </button>
          </div>
        </form>
      </CamvellePanel>

      <div className="mt-8 flex justify-center">
        <Link href="/status" className={camvelleGhostButton}>
          Check Client Status
        </Link>
      </div>
    </CamvellePageShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <CamvelleInnerPanel className="p-6">
      <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </label>

      {children}
    </CamvelleInnerPanel>
  );
}