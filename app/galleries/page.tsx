"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    description:
      "Clean, polished property imagery designed to showcase your property.",
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

              <Link href="/galleries" className="text-white">
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

              <Link href="/login" className="hover:text-white">
                Studio Login
              </Link>
            </nav>
          </div>
        </details>
      </header>

      <CamvellePanel className="p-8 sm:p-10 md:p-14">
        <CamvelleEyebrow>Camvelle Galleries</CamvelleEyebrow>

        <CamvelleHeading>
          View galleries
          <br />
          by experience.
        </CamvelleHeading>

        <CamvelleBody>
          Explore Camvelle Creative photography collections organized by story,
          emotion, and session experience.
        </CamvelleBody>
      </CamvellePanel>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {galleries.map((gallery, index) => {
          const previewPhotos = photos
            .filter((photo) => photo.gallery_type === gallery.slug)
            .slice(0, 6);

          return (
            <Link key={gallery.title} href={gallery.href} className="group">
              <CamvelleInnerPanel className="h-full p-8 transition duration-500 hover:border-white/20 hover:bg-white/[0.04]">
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                  {String(index + 1).padStart(2, "0")} / Gallery
                </p>

                {previewPhotos.length > 0 ? (
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
                ) : (
                  <div className="mt-10 flex h-[230px] items-center justify-center rounded-[2rem] border border-white/10 bg-black/30 text-center text-xs uppercase tracking-[0.35em] text-white/25">
                    Gallery Preview
                  </div>
                )}

                <div className="mt-10">
                  <h2 className="text-5xl font-light tracking-[-0.07em] text-white">
                    {gallery.title}
                  </h2>

                  <p className="mt-5 text-base leading-8 text-white/50">
                    {gallery.description}
                  </p>

                  <span className={`${camvelleGhostButton} mt-8 inline-flex`}>
                    View Gallery
                  </span>
                </div>
              </CamvelleInnerPanel>
            </Link>
          );
        })}
      </section>
    </CamvellePageShell>
  );
}
