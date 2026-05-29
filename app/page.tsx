"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const services = ["Proposals", "Couples", "Families", "Portraits", "Business", "Automotive", "Events"];

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
      message: `Location: ${form.get("location")}\n\nDetails: ${form.get("message")}`,
      status: "new",
    });

    setSending(false);

    if (error) {
      console.error(error);
      alert("Booking request failed.");
      return;
    }

    formElement.reset();
    setSuccess("Booking request submitted. I’ll follow up soon.");
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
              <a href="#book">Book</a>
              <Link href="/login">Studio Login</Link>
            </nav>
          </div>
        </details>
      </header>

      <section className="relative z-10 px-5 pb-24 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <p className="mb-8 text-xs uppercase tracking-[0.7em] text-white/35">
              Naturally Timeless
            </p>

            <h1 className="max-w-6xl text-[4.5rem] font-light leading-[0.82] tracking-[-0.1em] md:text-[8rem] lg:text-[10rem]">
              Elevated
              <br />
              Photography
            </h1>

            <p className="mt-10 max-w-3xl text-xl leading-9 text-white/52">
              Timeless photography services for proposals, couples, families,
              portraits, brands, and cinematic emotional storytelling.
            </p>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/galleries"
                className="rounded-full border border-white/15 bg-white/[0.04] px-8 py-5 text-center text-xs font-bold uppercase tracking-[0.35em] text-white/70 backdrop-blur-xl transition hover:bg-white hover:text-black"
              >
                Enter Gallery
              </Link>

              <a
                href="#book"
                className="rounded-full bg-[#f5f0e7] px-8 py-5 text-center text-xs font-black uppercase tracking-[0.35em] text-black shadow-[0_0_45px_rgba(245,240,231,.18)]"
              >
                Book Session
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-full bg-white/10 blur-3xl" />
            <div className="relative rounded-[3rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_0_100px_rgba(255,255,255,.08)] backdrop-blur-2xl">
              <div className="aspect-[4/5] rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_45%_20%,rgba(255,255,255,.25),transparent_24%),linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.02))]" />
              <div className="absolute bottom-10 left-10 right-10 rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-2xl">
                <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                  Signature System
                </p>
                <p className="mt-3 text-3xl font-light tracking-[-0.06em]">
                  cinematic / clean / emotional
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="relative z-10 px-5 py-24 md:px-10">
        <h2 className="max-w-5xl text-5xl font-light leading-none tracking-[-0.08em] md:text-7xl">
          Choose the experience.

        </h2>

      

     <div className="mt-14 grid gap-5 md:grid-cols-3">
  {services.map((service, i) => {
    const slug = gallerySlug(service);
    const previewPhotos = galleryPhotos
      .filter((photo) => photo.gallery_type === slug)
      .slice(0, 4);

    return (
      <Link
        key={service}
        href={`/galleries/${slug}`}
        className="group relative flex min-h-[520px] w-[82vw] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 transition hover:border-white/20 hover:bg-white/[0.06] md:w-[520px]"
      >
        <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_70%_20%,rgba(245,240,231,.14),transparent_28%)]" />

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.35em] text-white/30">
            0{i + 1} / Gallery
          </p>

          {previewPhotos.length > 0 && (
            <div className="mt-10 flex max-w-full gap-4 overflow-x-scroll overscroll-x-contain pb-3 snap-x snap-mandatory scrollbar-hide">
              {previewPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square w-[72%] shrink-0 snap-center overflow-hidden rounded-3xl border border-white/10 bg-black/40 sm:w-[45%] md:w-[42%]"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || service}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-12">
          <h3 className="text-6xl font-light tracking-[-0.07em]">
            {service}
          </h3>

          <p className="mt-6 max-w-sm text-lg leading-8 text-white/45">
            Elevated direction, intentional editing, and images that feel like
            memory.
          </p>
        </div>
      </Link>
    );
  })}
</div>
</section>

   

      <section id="services" className="relative z-10 px-5 py-24 md:px-10">
        <div className="rounded-[3rem] border border-white/10 bg-white/[0.045] p-7 backdrop-blur-2xl md:p-12">
          <p className="mb-5 text-xs uppercase tracking-[0.7em] text-white/35">
            Services
          </p>

          <h2 className="max-w-4xl text-5xl font-light leading-none tracking-[-0.08em] md:text-7xl">
            Premium imagery built for modern stories.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service}
                className="rounded-[2rem] border border-white/10 bg-black/25 p-6"
              >
                <h3 className="text-2xl font-light">{service}</h3>
                <p className="mt-4 leading-7 text-white/45">
                  Polished direction, cinematic edits, and a gallery-ready final
                  look.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="book" className="relative z-10 px-5 py-24 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.7em] text-white/35">
              Booking
            </p>

            <h2 className="text-5xl font-light leading-none tracking-[-0.08em] md:text-7xl">
              Begin the
              <br />
              visual story.
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-8 text-white/52">
              Submit your session details and location. I’ll follow up with
              availability, pricing, and next steps.
            </p>
          </div>

          <form
            onSubmit={handleBooking}
            className="rounded-[3rem] border border-white/10 bg-white/[0.05] p-7 shadow-[0_0_90px_rgba(255,255,255,.08)] backdrop-blur-2xl md:p-10"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <input name="full_name" required className="neo-input" placeholder="Full Name" />
              <input name="email" required type="email" className="neo-input" placeholder="Email" />
              <input name="phone" className="neo-input" placeholder="Phone" />
              <input name="location" className="neo-input" placeholder="Location" />

              <select name="service_type" required className="neo-input" defaultValue="">
                <option value="" disabled>Service Type</option>
                {services.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>

              <input name="preferred_date" type="date" className="neo-input" />

              <textarea
                name="message"
                className="neo-input min-h-40 md:col-span-2"
                placeholder="Tell me about your vision..."
              />
            </div>

            {success && (
              <div className="mt-5 rounded-3xl border border-green-400/25 bg-green-500/10 p-4 text-green-100">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-6 w-full rounded-full bg-[#f5f0e7] px-8 py-5 text-xs font-black uppercase tracking-[0.35em] text-black shadow-[0_0_45px_rgba(245,240,231,.16)]"
            >
              {sending ? "Sending..." : "Submit Booking Request"}
            </button>
          </form>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-10 text-xs uppercase tracking-[0.35em] text-white/35 md:px-10">
        Camvelle Creative
      </footer>

      <style jsx global>{`
        .neo-input {
          width: 100%;
          border-radius: 1.35rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.045);
          padding: 1.05rem 1.15rem;
          color: #f5f0e7;
          outline: none;
        }

        .neo-input::placeholder {
          color: rgba(245, 240, 231, 0.34);
        }

        .neo-input:focus {
          border-color: rgba(245, 240, 231, 0.55);
          background: rgba(255, 255, 255, 0.075);
        }

        option {
          background: #050403;
          color: #f5f0e7;
        }

        .scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

      `}</style>
    </main>
  );
}
