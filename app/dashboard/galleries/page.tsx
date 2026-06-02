"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ImagePlus,
  Pencil,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
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

const GALLERY_BUCKET = "camvelle-galleries";

type GalleryType = {
  label: string;
  value: string;
};

type GalleryPhoto = {
  id: string;
  gallery_type: string;
  image_url: string;
  caption: string | null;
  created_at: string | null;
};

const galleryTypes: GalleryType[] = [
  { label: "Proposals", value: "proposals" },
  { label: "Couples", value: "couples" },
  { label: "Families", value: "families" },
  { label: "Portraits", value: "portraits" },
  { label: "Business", value: "business" },
  { label: "Real Estate", value: "real-estate" },
  { label: "Automotive", value: "automotive" },
  { label: "Events", value: "events" },
];

const sections = ["overview", "clients", "bookings", "calendar", "finance"];

export default function DashboardGalleriesPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState("proposals");
  const [uploadGallery, setUploadGallery] = useState("proposals");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    gallery_type: "",
    caption: "",
  });

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("gallery_photos")
      .select("id, gallery_type, image_url, caption, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setPhotos(data || []);
    setLoading(false);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function uploadPhoto() {
    if (!selectedFile) {
      alert("Choose an image first.");
      return;
    }

    setUploading(true);
    setNotice("");

    const fileExtension = selectedFile.name.split(".").pop() || "jpg";
    const safeFileName = selectedFile.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const filePath = `${uploadGallery}/${Date.now()}-${safeFileName}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploading(false);
      alert(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(GALLERY_BUCKET)
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from("gallery_photos").insert({
      gallery_type: uploadGallery,
      image_url: imageUrl,
      caption: caption || null,
    });

    setUploading(false);

    if (insertError) {
      alert(insertError.message);
      return;
    }

    setCaption("");
    setSelectedFile(null);
    setSelectedGallery(uploadGallery);
    setNotice("Gallery image uploaded successfully.");
    await loadPhotos();

    const fileInput = document.getElementById("gallery-upload") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  }

  function startEdit(photo: GalleryPhoto) {
    setEditingId(photo.id);
    setNotice("");

    setEditForm({
      gallery_type: photo.gallery_type || "proposals",
      caption: photo.caption || "",
    });
  }

  async function savePhoto(photoId: string) {
    setSavingId(photoId);
    setNotice("");

    const { error } = await supabase
      .from("gallery_photos")
      .update({
        gallery_type: editForm.gallery_type,
        caption: editForm.caption || null,
      })
      .eq("id", photoId);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setNotice("Gallery photo updated.");
    await loadPhotos();
  }

  async function deletePhoto(photo: GalleryPhoto) {
    const confirmDelete = confirm("Delete this gallery photo?");
    if (!confirmDelete) return;

    setDeletingId(photo.id);
    setNotice("");

    const { error } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", photo.id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Gallery photo deleted.");
    await loadPhotos();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredPhotos = useMemo(() => {
    const term = search.toLowerCase();

    return photos.filter((photo) => {
      const matchesGallery =
        selectedGallery === "all" || photo.gallery_type === selectedGallery;

      const matchesSearch =
        photo.gallery_type?.toLowerCase().includes(term) ||
        photo.caption?.toLowerCase().includes(term) ||
        getGalleryLabel(photo.gallery_type).toLowerCase().includes(term);

      return matchesGallery && matchesSearch;
    });
  }, [photos, selectedGallery, search]);

  const totalByGallery = useMemo(() => {
    const counts: Record<string, number> = {};

    galleryTypes.forEach((gallery) => {
      counts[gallery.value] = 0;
    });

    photos.forEach((photo) => {
      counts[photo.gallery_type] = (counts[photo.gallery_type] || 0) + 1;
    });

    return counts;
  }, [photos]);

  return (
    <CamvellePageShell>
      <header className="mb-10 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center">
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

        <button type="button" onClick={handleLogout} className={camvelleCreamButton}>
          Logout
        </button>
      </header>

      <CamvellePanel className="p-7 text-center sm:p-10 md:p-14">
        <CamvelleEyebrow>Gallery Management</CamvelleEyebrow>

        <CamvelleHeading>
          Gallery
          <br />
          Studio
        </CamvelleHeading>

        <CamvelleBody>
          Upload, organize, edit, and manage images shown across your Camvelle
          Creative galleries and homepage previews.
        </CamvelleBody>

        <div className="mx-auto mt-12 w-full max-w-xl text-left">
          <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
            Navigate
          </label>

          <select
            defaultValue="galleries"
            onChange={(e) => {
              if (e.target.value === "overview") {
                window.location.href = "/dashboard";
                return;
              }

              if (e.target.value) {
                window.location.href = `/dashboard/${e.target.value}`;
              }
            }}
            className="w-full rounded-full border border-white/10 bg-black/20 px-7 py-5 text-[11px] font-bold uppercase tracking-[0.35em] text-white outline-none transition hover:border-white/20 hover:bg-black/30"
          >
            <option value="galleries" className="bg-black">
              Galleries
            </option>

            {sections.map((section) => (
              <option key={section} value={section} className="bg-black">
                {section}
              </option>
            ))}
          </select>
        </div>
      </CamvellePanel>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Photos" value={String(photos.length)} />
        <StatCard title="Visible" value={String(filteredPhotos.length)} />
        <StatCard title="Galleries" value={String(galleryTypes.length)} />
        <StatCard
          title="Selected"
          value={selectedGallery === "all" ? "All" : getGalleryLabel(selectedGallery)}
        />
      </div>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Upload Image</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Add to
              <br />
              gallery.
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
            <ImagePlus size={18} />
          </div>
        </div>

        {notice && (
          <div className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
            {notice}
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <CamvelleInnerPanel className="p-5">
            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
              Gallery Type
            </label>

            <select
              value={uploadGallery}
              onChange={(e) => setUploadGallery(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-black/20 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.25em] text-white outline-none"
            >
              {galleryTypes.map((gallery) => (
                <option key={gallery.value} value={gallery.value} className="bg-black">
                  {gallery.label}
                </option>
              ))}
            </select>
          </CamvelleInnerPanel>

          <CamvelleInnerPanel className="p-5">
            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
              Image File
            </label>

            <input
              id="gallery-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-[#f5f0e7] file:px-5 file:py-3 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.25em] file:text-black"
            />

            {selectedFile && (
              <p className="mt-3 text-xs leading-6 text-white/40">
                Selected: {selectedFile.name}
              </p>
            )}
          </CamvelleInnerPanel>

          <CamvelleInnerPanel className="p-5 md:col-span-2">
            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
              Caption
            </label>

            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </CamvelleInnerPanel>
        </div>

        <button
          type="button"
          onClick={uploadPhoto}
          disabled={uploading}
          className={`mt-6 w-full ${camvelleCreamButton} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Gallery Library</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Manage
              <br />
              photos.
            </h2>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <Search size={16} className="text-white/35" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search photos..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedGallery("all")}
            className={`shrink-0 ${
              selectedGallery === "all" ? camvelleCreamButton : camvelleGhostButton
            }`}
          >
            All
          </button>

          {galleryTypes.map((gallery) => (
            <button
              key={gallery.value}
              type="button"
              onClick={() => setSelectedGallery(gallery.value)}
              className={`shrink-0 ${
                selectedGallery === gallery.value
                  ? camvelleCreamButton
                  : camvelleGhostButton
              }`}
            >
              {gallery.label} {totalByGallery[gallery.value] || 0}
            </button>
          ))}
        </div>

        {loading && <p className="mt-10 text-white/50">Loading gallery photos...</p>}

        {!loading && filteredPhotos.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
            No gallery photos found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPhotos.map((photo) => {
            const isEditing = editingId === photo.id;

            return (
              <CamvelleInnerPanel key={photo.id} className="overflow-hidden p-0">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-t-[2.4rem] bg-black/30">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || getGalleryLabel(photo.gallery_type)}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  {!isEditing && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CamvelleStatusPill status={getGalleryLabel(photo.gallery_type)} />

                        <p className="text-xs text-white/35">
                          {photo.created_at
                            ? new Date(photo.created_at).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      <p className="mt-5 min-h-12 text-sm leading-7 text-white/55">
                        {photo.caption || "No caption saved."}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <IconButton
                          label="Edit"
                          icon={<Pencil size={16} />}
                          onClick={() => startEdit(photo)}
                        />

                        <IconButton
                          label={deletingId === photo.id ? "Deleting" : "Delete"}
                          icon={<Trash2 size={16} />}
                          onClick={() => deletePhoto(photo)}
                          disabled={deletingId === photo.id}
                          danger
                        />

                        <a
                          href={photo.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className={camvelleGhostButton}
                        >
                          Open
                        </a>
                      </div>
                    </>
                  )}

                  {isEditing && (
                    <>
                      <div className="grid gap-4">
                        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                          <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                            Gallery Type
                          </label>

                          <select
                            value={editForm.gallery_type}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                gallery_type: e.target.value,
                              })
                            }
                            className="w-full bg-transparent text-white outline-none"
                          >
                            {galleryTypes.map((gallery) => (
                              <option
                                key={gallery.value}
                                value={gallery.value}
                                className="bg-black"
                              >
                                {gallery.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                          <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                            Caption
                          </label>

                          <textarea
                            rows={4}
                            value={editForm.caption}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                caption: e.target.value,
                              })
                            }
                            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <IconButton
                          label={savingId === photo.id ? "Saving" : "Save"}
                          icon={<Save size={16} />}
                          onClick={() => savePhoto(photo.id)}
                          disabled={savingId === photo.id}
                        />

                        <IconButton
                          label="Cancel"
                          icon={<X size={16} />}
                          onClick={() => setEditingId(null)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CamvelleInnerPanel>
            );
          })}
        </div>
      </CamvellePanel>
    </CamvellePageShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <CamvellePanel className="p-7">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em] text-white">
        {value}
      </h3>
    </CamvellePanel>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  danger = false,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          : "border-white/10 bg-black/20 text-white/65 hover:bg-[#f5f0e7] hover:text-black"
      }`}
    >
      {icon}
    </button>
  );
}

function getGalleryLabel(value: string | null | undefined) {
  const match = galleryTypes.find((gallery) => gallery.value === value);

  return match?.label || "Gallery";
}
