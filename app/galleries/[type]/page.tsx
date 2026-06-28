"use client";

import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CamvelleBody,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleInnerPanel,
  CamvellePageShell,
  CamvellePanel,
  camvelleCreamButton,
  camvelleGhostButton,
} from "../../components/CamvelleUI";

type GalleryPhoto = {
  id: string;
  gallery_type: string;
  image_url: string;
  caption: string | null;
};

function formatGalleryTitle(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function GalleryDetailPage() {
  const params = useParams();
  const type = String(params.type || "");
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    async function loadPhotos() {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, gallery_type, image_url, caption, created_at")
        .eq("gallery_type", type)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setPhotos((data || []) as GalleryPhoto[]);
    }

    if (type) {
      loadPhotos();
    }
  }, [type]);

  const galleryTitle = formatGalleryTitle(type);

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
        <CamvelleEyebrow>Camvelle Gallery</CamvelleEyebrow>

        <CamvelleHeading>
          {galleryTitle}
          <br />
          Gallery
        </CamvelleHeading>

        <CamvelleBody>
          A collection of naturally timeless images and videos from this
          Camvelle Creative experience.
        </CamvelleBody>

        <div className="mt-10">
          <Link href="/galleries" className={camvelleGhostButton}>
            Back to Galleries
          </Link>
        </div>
      </CamvellePanel>

      {photos.length === 0 ? (
        <CamvellePanel className="mt-8 p-8 text-center sm:p-10 md:p-14">
          <CamvelleEyebrow>No Media Yet</CamvelleEyebrow>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/50">
            This gallery is ready, but no photos or videos have been added yet.
          </p>
        </CamvellePanel>
      ) : (
        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => {
            const isVideo = isVideoUrl(photo.image_url);

            return (
              <CamvelleInnerPanel
                key={photo.id}
                className="overflow-hidden p-0 transition duration-500 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="overflow-hidden rounded-[2.4rem] bg-black/40">
                  {isVideo ? (
                    <video
                      src={photo.image_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-[4/5] w-full object-cover"
                    />
                  ) : (
                    <img
                      src={photo.image_url}
                      alt={photo.caption || galleryTitle}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/5] w-full object-cover"
                    />
                  )}
                </div>

                <div className="p-6">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {isVideo ? "Video" : "Image"}
                  </p>

                  {photo.caption ? (
                    <p className="mt-4 text-base leading-8 text-white/55">
                      {photo.caption}
                    </p>
                  ) : (
                    <p className="mt-4 text-base leading-8 text-white/35">
                      {galleryTitle}
                    </p>
                  )}
                </div>
              </CamvelleInnerPanel>
            );
          })}
        </section>
      )}
    </CamvellePageShell>
  );
}

function isVideoUrl(value: string | null | undefined) {
  if (!value) return false;

  const cleanValue = value.split("?")[0].toLowerCase();

  return (
    cleanValue.endsWith(".mp4") ||
    cleanValue.endsWith(".mov") ||
    cleanValue.endsWith(".webm") ||
    cleanValue.endsWith(".m4v")
  );
}
