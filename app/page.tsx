"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";
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
} from "./components/CamvelleUI";

const services = [
  "Proposals",
  "Couples",
  "Families",
  "Portraits",
  "Business",
  "Real Estate",
  "Automotive",
  "Events",
];

type GalleryPhoto = {
  id: string;
  gallery_type: string;
  image_url: string;
  caption: string | null;
  created_at?: string | null;
};

function gallerySlug(service: string) {
  return service.toLowerCase().replace(/\s+/g, "-");
}

const serviceDescriptions: Record<string, string> = {
  Proposals:
    "Authentic reactions, unforgettable moments, and the beginning of your story together.",
  Couples:
    "Natural connection, genuine emotion, and timeless imagery that celebrates your relationship.",
  Families:
    "Real moments, meaningful connections, and memories preserved for generations.",
  Portraits:
    "Confident, refined portraits designed to showcase personality and presence.",
  Business:
    "Professional imagery crafted to elevate your brand, reputation, and visual identity.",
  "Real Estate":
    "Clean, polished property imagery designed to showcase spaces with clarity, depth, and market appeal.",
  Automotive:
    "Dynamic compositions, dramatic detail, and imagery that highlights the character of every vehicle.",
  Events:
    "Thoughtful coverage that captures the atmosphere, energy, and moments that matter most.",
};

export default function HomePage() {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    loadGalleryPhotos();
  }, []);

  async function loadGalleryPhotos() {
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("id, gallery_type, image_url, caption, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setGalleryPhotos(data || []);
  }

  async function handleBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    setSending(true);
    setSuccess("");

    const { error } = await supabase.from("inquiries").insert({
      full_name: form.get("full_name"),
      email: form.get("email"),
      phone: form.get("phone"),
      service_type: form.get("service_type"),
      preferred_date: form.get("preferred_date") || null,
      message: `Location: ${form.get("location")}\n\nDetails: ${form.get(
        "message"
      )}`,
      status: "new",
    });

    if (error) {
      setSending(false);
      console.error(error);
      alert("Booking request failed.");
      return;
    }

    try {
      await fetch("/api/bookings/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: form.get("full_name"),
          clientEmail: form.get("email"),
          clientPhone: form.get("phone"),
          sessionType: form.get("service_type"),
          preferredDate: form.get("preferred_date"),
          location: form.get("location"),
          details: form.get("message"),
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
              <Link href="/" className="text-white">
                Home
              </Link>

              <Link href="/galleries" className="hover:text-white">
                Galleries
              </Link>

              <Link href="/services" className="hover:text-white">
                Services
              </Link>

              <a href="#book" className="hover:text-white">
                Book
              </a>

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

      <section className="w-full overflow-hidden">
  <CamvellePanel className="mx-auto w-full max-w-full overflow-hidden p-8 sm:p-10 md:p-14">
    <CamvelleEyebrow>Naturally Timeless</CamvelleEyebrow>

<h1 className="mt-7 max-w-full text-[3.65rem] font-light leading-[0.92] tracking-[-0.085em] text-white sm:text-7xl md:text-8xl">
  Designed to Stand The Test
  <br />
  Of Time
</h1>

<p className="mt-8 text-sm font-semibold tracking-[0.08em] text-white sm:text-base">
  Authentic. Creative. Timeless.
</p>

<p className="p-8 sm:p-10 md:p-14">
  Camvelle Creative provides timeless photography for couples, families,
  brands, businesses, and events across The Grand Strand.
</p>

<div className="mt-12 flex flex-col gap-4 sm:flex-row">
  <Link href="/galleries" className={camvelleGhostButton}>
    Enter Gallery
  </Link>

  <a href="#book" className={camvelleCreamButton}>
    Book Session
  </a>
</div>


  </CamvellePanel>
</section>


      <section id="galleries" className="mt-10">
        <CamvellePanel className="p-8 sm:p-10 md:p-14">
          <CamvelleEyebrow>Galleries</CamvelleEyebrow>

          <CamvelleHeading>
            Choose the
            <br />
            experience.
          </CamvelleHeading>

          <CamvelleBody>
            Explore Camvelle Creative galleries by session type and story.
          </CamvelleBody>
        </CamvellePanel>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((service, index) => {
            const slug = gallerySlug(service);
            const previewPhoto = galleryPhotos.find(
              (photo) => photo.gallery_type === slug
            );

            return (
              <Link
                key={service}
                href={`/galleries/${slug}`}
                className={`group ${
                  index === 0 ? "md:col-span-2" : ""
                }`}
              >
                <CamvelleInnerPanel className="flex min-h-[520px] flex-col p-8 transition duration-500 hover:border-white/20 hover:bg-white/[0.04]">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                    {String(index + 1).padStart(2, "0")} / Gallery
                  </p>

                  {previewPhoto ? (
                    <div className="mt-10 h-[260px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/35">
                      <img
                        src={previewPhoto.image_url}
                        alt={previewPhoto.caption || service}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="mt-10 flex h-[260px] items-center justify-center rounded-[2.5rem] border border-white/10 bg-black/25 text-center text-xs uppercase tracking-[0.35em] text-white/25">
                      Gallery Preview
                    </div>
                  )}

                  <div className="mt-auto pt-12">
                    <h3 className="text-5xl font-light tracking-[-0.07em] text-white">
                      {service}
                    </h3>

                    <p className="mt-5 max-w-sm text-base leading-8 text-white/45">
                      {serviceDescriptions[service]}
                    </p>
                  </div>
                </CamvelleInnerPanel>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="services" className="mt-10">
        <CamvellePanel className="p-8 sm:p-10 md:p-14">
          <CamvelleEyebrow>Services</CamvelleEyebrow>

          <Link href="/services" className="block">
            <h2 className="mt-6 max-w-4xl text-5xl font-light leading-none tracking-[-0.08em] text-white transition hover:text-white/85 md:text-7xl">
              Premium imagery built for modern stories.
            </h2>
          </Link>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <Link key={service} href="/services" className="group block">
                <CamvelleInnerPanel className="h-full p-8 transition duration-500 hover:border-white/20 hover:bg-white/[0.04]">
                  <h3 className="text-3xl font-light tracking-[-0.04em] text-white">
                    {service}
                  </h3>

                  <p className="mt-5 text-base leading-8 text-white/45">
                    {serviceDescriptions[service]}
                  </p>

                  <div className="mt-8 text-xs uppercase tracking-[0.4em] text-white/30 transition group-hover:text-white/60">
                    View Service →
                  </div>
                </CamvelleInnerPanel>
              </Link>
            ))}
          </div>
        </CamvellePanel>
      </section>

      <section id="book" className="mt-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <CamvellePanel className="p-8 sm:p-10 md:p-12">
            <CamvelleEyebrow>Booking</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-light leading-none tracking-[-0.08em] text-white md:text-7xl">
              Begin the
              <br />
              visual story.
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-8 text-white/52">
              Submit your session details and location. I’ll follow up with
              availability, pricing, and next steps.
            </p>

            <div className="mt-10">
              <Link href="/status" className={camvelleGhostButton}>
                Check Client Status
              </Link>
            </div>
          </CamvellePanel>

          <CamvellePanel className="p-7 sm:p-10">
            <form onSubmit={handleBooking}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <input
                    name="full_name"
                    required
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
                    placeholder="Full Name"
                  />
                </Field>

                <Field>
                  <input
                    name="email"
                    required
                    type="email"
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
                    placeholder="Email"
                  />
                </Field>

                <Field>
                  <input
                    name="phone"
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
                    placeholder="Phone"
                  />
                </Field>

                <Field>
                  <input
                    name="location"
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25"
                    placeholder="Location"
                  />
                </Field>

                <Field>
                  <select
                    name="service_type"
                    required
                    className="w-full bg-transparent text-lg text-white outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-black">
                      Service Type
                    </option>

                    {services.map((service) => (
                      <option key={service} className="bg-black">
                        {service}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field>
                  <input
                    name="preferred_date"
                    type="date"
                    className="w-full bg-transparent text-lg text-white outline-none"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field>
                    <textarea
                      name="message"
                      rows={7}
                      className="w-full resize-none bg-transparent text-lg text-white outline-none placeholder:text-white/25"
                      placeholder="Tell me about your vision..."
                    />
                  </Field>
                </div>
              </div>

              {success && (
                <div className="mt-5 rounded-[2rem] border border-emerald-400/25 bg-emerald-500/10 p-5 text-emerald-100">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className={`${camvelleCreamButton} mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {sending ? "Sending..." : "Submit Booking Request"}
              </button>
            </form>
          </CamvellePanel>
        </div>
      </section>


     
      <footer className="mt-12 border-t border-white/10 py-10 text-xs uppercase tracking-[0.35em] text-white/35">
         <div className="rounded-[2.5rem] border border-white/10 bg-black/20 p-7">
    <p className="text-[10px] uppercase tracking-[0.45em] text-white/35">
      Camvelle Creative LLC
    </p>

    <div className="mt-5 flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">
      <Link href="/privacy" className="transition hover:text-white">
        Privacy
      </Link>

      <Link href="/terms" className="transition hover:text-white">
        Terms
      </Link>

      <Link href="/refund-policy" className="transition hover:text-white">
        Refund Policy
      </Link>
    </div>

    <p className="mt-5 text-xs text-white/30">
      © {new Date().getFullYear()} Camvelle Creative. All rights reserved.
    </p>
  </div>
        
      
      </footer>


      
    </CamvellePageShell>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <CamvelleInnerPanel className="p-5">{children}</CamvelleInnerPanel>;
}
