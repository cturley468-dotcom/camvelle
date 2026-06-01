"use client";

import Header from "@/app/components/Header";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type GalleryPhoto = {
  id: string;
  gallery_type: string;
  image_url: string;
  caption: string | null;
};

export default function GalleryDetailPage() {
  const params = useParams();
  const type = String(params.type);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    async function loadPhotos() {
      const { data } = await supabase
        .from("gallery_photos")
        .select("*")
        .eq("gallery_type", type)
        .order("created_at", { ascending: false });

      setPhotos(data || []);
    }

    loadPhotos();
  }, [type]);

  return (
    <main className="relative min-h-screen bg-[#020202] text-[#f5f1e8]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(80,70,180,0.16),transparent_26%)]" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <Header />

      <section className="relative z-10 px-5 pb-24 pt-10 md:px-10">
        <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
          Camvelle Gallery
        </p>

        <h1 className="mt-8 capitalize text-6xl font-light tracking-[-0.08em] md:text-8xl">
          {type}
        </h1>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.035]"
            >
              <img
                src={photo.image_url}
                alt={photo.caption || type}
                className="aspect-[4/5] w-full object-cover"
              />

              {photo.caption && (
                <p className="p-5 text-white/55">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
