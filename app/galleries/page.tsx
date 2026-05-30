"use client";

import Header from "../components/Header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type GalleryPhoto = {
  id: string;
  gallery_type: string;
  image_url: string;
  caption: string | null;
  created_at?: string | null;
};

const galleries = [
  {
    title: "Proposals",
    slug: "proposals",
    href: "/galleries/proposals",
    description: "Emotional, cinematic proposal storytelling.",
  },
  {
    title: "Couples",
    slug: "couples",
    href: "/galleries/couples",
    description: "Natural connection and timeless portraits.",
  },
  {
    title: "Families",
    slug: "families",
    href: "/galleries/families",
    description: "Warm, relaxed family memories.",
  },
  {
    title: "Portraits",
    slug: "portraits",
    href: "/galleries/portraits",
    description: "Editorial, personal, and creative portraits.",
  },
  {
    title: "Business",
    slug: "business",
    href: "/galleries/business",
    description: "Brand imagery, headshots, and content visuals.",
  },
  {
    title: "Real Estate",
    slug: "real-estate",
    href: "/galleries/real-estate",
    description: "Clean, polished property imagery designed to showcase your property.",
  },
  {
    title: "Automotive",
    slug: "automotive",
    href: "/galleries/automotive",
    description: "Showcase passion, craftsmanship, and character.",
  },
  {
    title: "Events",
    slug: "events",
    href: "/galleries/events",
    description: "Milestones, celebrations, and meaningful moments.",
  },
];

export default function GalleriesPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    async function loadPhotos() {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, gallery_type, image_url, caption, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setPhotos(data || []);
    }

    loadPhotos();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/backgrounds/camvelle-background.png')",
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </div>

      <Header />

      <section className="relative z-10 px-6 pb-24 pt-10 md:px-10">
        <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
          Camvelle Galleries
        </p>

        <h1 className="mt-8 max-w-6xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl lg:text-[7rem]">
          View galleries
          <br />
          by experience.
        </h1>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {galleries.map((gallery, index) => {
            const previewPhotos = photos
              .filter((photo) => photo.gallery_type === gallery.slug)
              .slice(0, 6);

            return (
              <Link
                key={gallery.title}
                href={gallery.href}
                className="group min-h-[520px] overflow-hidden rounded-[3rem] border border-white/10 bg-black/55 p-8 backdrop-blur-2xl transition hover:border-white/25"
              >
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                  {String(index + 1).padStart(2, "0")} / Gallery
                </p>

                {previewPhotos.length > 0 && (
                  <div className="mt-10 flex gap-4 overflow-x-auto pb-4">
                    {previewPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="h-[230px] w-[78%] shrink-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/40"
                      >
                        <img
                          src={photo.image_url}
                          alt={photo.caption || gallery.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className={previewPhotos.length > 0 ? "mt-10" : "mt-52"}>
                  <h2 className="text-5xl font-light tracking-[-0.07em]">
                    {gallery.title}
                  </h2>

                  <p className="mt-5 leading-8 text-white/50">
                    {gallery.description}
                  </p>

                  <span className="mt-8 inline-flex rounded-full border border-white/15 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70 group-hover:bg-white group-hover:text-black">
                    View Gallery
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
