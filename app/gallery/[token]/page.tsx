"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import {
  CamvellePageShell,
  CamvellePanel,
  CamvelleInnerPanel,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleBody,
  CamvelleStatusPill,
  camvelleCreamButton,
  camvelleGhostButton,
} from "@/app/components/CamvelleUI";

type ClientGallery = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  share_token: string;
  cover_image_url: string | null;
  expires_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
};

type ClientGalleryPhoto = {
  id: string;
  gallery_id: string;
  file_name: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  sort_order: number | null;
  is_cover: boolean | null;
  created_at: string | null;
};

const INITIAL_VISIBLE_COUNT = 24;
const LOAD_MORE_COUNT = 24;

export default function ClientGalleryPage() {
  const params = useParams();

  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [gallery, setGallery] = useState<ClientGallery | null>(null);
  const [photos, setPhotos] = useState<ClientGalleryPhoto[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (token) {
      loadGallery(token);
    }
  }, [token]);

  async function loadGallery(galleryToken: string) {
    setLoading(true);
    setErrorMessage("");
    setNotice("");

    const response = await fetch(`/api/client-gallery/${galleryToken}`, {
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.error || "Gallery could not be loaded.");
      setLoading(false);
      return;
    }

    setGallery(result.gallery || null);
    setPhotos(result.photos || []);
    setLoading(false);
  }

  async function copyCurrentLink() {
    await navigator.clipboard.writeText(window.location.href);
    setNotice("Gallery link copied.");
  }

  const coverPhoto = useMemo(() => {
    return photos.find((photo) => photo.is_cover) || photos[0] || null;
  }, [photos]);

  const coverImageUrl = gallery?.cover_image_url || coverPhoto?.file_url || null;

  const visiblePhotos = useMemo(() => {
    return photos.slice(0, visibleCount);
  }, [photos, visibleCount]);

  const hasMorePhotos = visibleCount < photos.length;

  return (
    <CamvellePageShell>
      <header className="mb-10 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/branding/camvelle-logo.png"
            alt="Camvelle Creative"
            width={420}
            height={120}
            priority
            unoptimized
            className="h-12 w-auto object-contain md:h-16 lg:h-20 xl:h-24"
          />
        </Link>

        <Link href="/" className={camvelleCreamButton}>
          Home
        </Link>
      </header>

      {loading && (
        <CamvellePanel className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
            <Loader2 size={20} className="animate-spin" />
          </div>

          <p className="mt-6 text-sm uppercase tracking-[0.35em] text-white/40">
            Loading Gallery
          </p>
        </CamvellePanel>
      )}

      {!loading && errorMessage && (
        <CamvellePanel className="p-10 text-center">
          <CamvelleEyebrow>Gallery Unavailable</CamvelleEyebrow>

          <CamvelleHeading>
            Link
            <br />
            unavailable.
          </CamvelleHeading>

          <CamvelleBody>{errorMessage}</CamvelleBody>

          <Link href="/" className={`mt-8 ${camvelleCreamButton}`}>
            Return to Camvelle
          </Link>
        </CamvellePanel>
      )}

      {!loading && gallery && (
        <>
          <CamvellePanel className="overflow-hidden p-0">
            {coverImageUrl && (
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/30 md:aspect-[16/8]">
                <img
                  src={coverImageUrl}
                  alt={gallery.title || "Camvelle Client Gallery"}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover opacity-70"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
              </div>
            )}

            <div className="p-7 text-center sm:p-10 md:p-14">
              <CamvelleEyebrow>Camvelle Client Gallery</CamvelleEyebrow>

              <CamvelleHeading>
                {gallery.title || "Client"}
                <br />
                Gallery.
              </CamvelleHeading>

              <CamvelleBody>
                {gallery.description ||
                  "Your private Camvelle gallery is ready to view."}
              </CamvelleBody>

              <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-3">
                <CamvelleStatusPill status={gallery.status || "gallery"} />

                <div className="rounded-full border border-white/10 bg-black/20 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">
                  {photos.length} Photo{photos.length === 1 ? "" : "s"}
                </div>

                {gallery.delivered_at && (
                  <div className="rounded-full border border-white/10 bg-black/20 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">
                    Delivered {formatDate(gallery.delivered_at)}
                  </div>
                )}
              </div>

              <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={copyCurrentLink}
                  className={camvelleGhostButton}
                >
                  <Copy size={15} />
                  Copy Link
                </button>

                {coverImageUrl && (
                  <a
                    href={coverImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={camvelleCreamButton}
                  >
                    <ExternalLink size={15} />
                    Open Cover
                  </a>
                )}
              </div>
            </div>
          </CamvellePanel>

          {notice && (
            <div className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
              {notice}
            </div>
          )}

          <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <CamvelleEyebrow>Photo Delivery</CamvelleEyebrow>

                <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
                  Your
                  <br />
                  photos.
                </h2>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
                  Tap any image to open the full-resolution file in a new tab.
                  More photos load in batches to keep the gallery smooth.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
                <ImageIcon size={18} />
              </div>
            </div>

            {photos.length === 0 && (
              <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
                No photos are available in this gallery yet.
              </CamvelleInnerPanel>
            )}

            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visiblePhotos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/25 transition duration-500 hover:border-white/25"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-black/30">
                    <img
                      src={photo.file_url}
                      alt={photo.file_name || "Camvelle Gallery Photo"}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <CamvelleStatusPill
                        status={photo.is_cover ? "Cover" : "Photo"}
                      />

                      <p className="text-xs text-white/35">
                        {formatFileSize(photo.file_size)}
                      </p>
                    </div>

                    <p className="mt-4 break-words text-xs leading-6 text-white/40">
                      {photo.file_name || "Gallery Photo"}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {hasMorePhotos && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((current) => current + LOAD_MORE_COUNT)
                  }
                  className={camvelleCreamButton}
                >
                  Load More Photos
                </button>
              </div>
            )}

            {photos.length > 0 && (
              <p className="mt-8 text-center text-xs uppercase tracking-[0.3em] text-white/35">
                Showing {Math.min(visibleCount, photos.length)} of{" "}
                {photos.length} photos
              </p>
            )}
          </CamvellePanel>
        </>
      )}
    </CamvellePageShell>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(value: number | null | undefined) {
  if (!value) return "";

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
