"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service_type: string | null;
  preferred_date: string | null;
  message: string | null;
  created_at: string | null;
};

type GalleryPhoto = {
  id: string;
  gallery_type: string;
  image_url: string;
  caption: string | null;
  created_at: string | null;
};

const sidebarItems = ["Overview", "Bookings", "Calendar", "Galleries", "Invoices", "Financial"];

const galleryTypes = ["proposals", "couples", "families", "portraits", "business","automotive", "events"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [galleryType, setGalleryType] = useState("proposals");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    loadInquiries();
    loadGalleryPhotos();
  }, []);

  function selectTab(item: string) {
    setActiveTab(item);

    setTimeout(() => {
      document
        .getElementById("dashboard-content")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 75);
  }

  async function loadInquiries() {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setInquiries(data || []);
    setLoading(false);
  }

  async function loadGalleryPhotos() {
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setPhotos(data || []);
  }

  async function handleUpload() {
    if (files.length === 0) {
      alert("Choose at least one image first.");
      return;
    }

    setUploading(true);

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${galleryType}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("camvelle-galleries")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("camvelle-galleries")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("gallery_photos").insert({
        gallery_type: galleryType,
        image_url: publicData.publicUrl,
        caption: caption || null,
      });

      if (insertError) {
        console.error(insertError);
        alert(insertError.message);
        setUploading(false);
        return;
      }
    }

    setFiles([]);
    setCaption("");
    await loadGalleryPhotos();
    setUploading(false);
    alert("Gallery photos uploaded.");
  }

  async function deletePhoto(photo: GalleryPhoto) {
    const confirmDelete = confirm("Delete this gallery photo?");
    if (!confirmDelete) return;

    const urlParts = photo.image_url.split("/camvelle-galleries/");
    const storagePath = urlParts[1];

    if (storagePath) {
      await supabase.storage.from("camvelle-galleries").remove([storagePath]);
    }

    await supabase.from("gallery_photos").delete().eq("id", photo.id);
    await loadGalleryPhotos();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#020202] text-[#f5f1e8]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(80,70,180,0.16),transparent_26%),radial-gradient(circle_at_50%_85%,rgba(255,255,255,0.08),transparent_30%)]" />
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

      <header className="relative z-50 flex items-center justify-between px-5 py-6 md:px-10">
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

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-white/10 bg-[#f5f0e7] px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-black transition active:scale-95 md:px-8"
        >
          Logout
        </button>
      </header>

      <section className="relative z-10 px-5 pb-24 pt-4 md:px-10">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <p className="mb-8 text-[11px] uppercase tracking-[0.45em] text-white/35">
              Studio Dashboard
            </p>

            <div className="space-y-3">
              {sidebarItems.map((item) =>
                item === "Calendar" ? (
                  <Link
                    key={item}
                    href="/calendar"
                    className="block w-full rounded-full border border-white/10 bg-white/[0.03] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em] text-white/65 transition active:scale-[0.98] hover:bg-white/[0.05] hover:text-white"
                  >
                    {item}
                  </Link>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
  setActiveTab(item);

  setTimeout(() => {
    document
      .getElementById("dashboard-content")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}}
                    className={`block w-full rounded-full px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em] transition active:scale-[0.98] ${
                      activeTab === item
                        ? "bg-[#f5f0e7] text-black"
                        : "border border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </aside>

          <section
            id="dashboard-content"
            className="scroll-mt-6 rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-10"
          >
            {activeTab === "Overview" && (
              <>
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
                  Overview
                </p>

                <h1 className="mt-6 text-5xl font-light tracking-[-0.06em] md:text-7xl">
                  Welcome back.
                </h1>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                  <StatCard title="Bookings" value={String(inquiries.length)} />
                  <StatCard title="Gallery Photos" value={String(photos.length)} />
                  <StatCard title="Invoices" value="0" />
                </div>
              </>
            )}

            {activeTab === "Bookings" && (
              <>
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
                  Booking Inquiries
                </p>

                <h1 className="mt-6 text-5xl font-light tracking-[-0.06em] md:text-7xl">
                  Client inquiries.
                </h1>

                <div className="mt-10 space-y-5">
                  {loading && <PanelText>Loading inquiries...</PanelText>}

                  {!loading && inquiries.length === 0 && (
                    <PanelText>No booking inquiries yet.</PanelText>
                  )}

                  {inquiries.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-6 md:p-8"
                    >
                      <p className="text-3xl font-light tracking-[-0.04em]">
                        {item.full_name || "Unnamed Inquiry"}
                      </p>

                      <p className="mt-3 text-sm uppercase tracking-[0.25em] text-white/35">
                        {item.service_type || "No service selected"}
                      </p>

                      <div className="mt-8 grid gap-5 md:grid-cols-2">
                        <InfoCard label="Email" value={item.email} />
                        <InfoCard label="Phone" value={item.phone} />
                      </div>

                      <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-6">
                        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
                          Details
                        </p>
                        <p className="mt-4 whitespace-pre-wrap leading-8 text-white/55">
                          {item.message || "No details provided."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "Galleries" && (
              <>
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
                  Galleries
                </p>

                <h1 className="mt-6 text-5xl font-light tracking-[-0.06em] md:text-7xl">
                  Upload gallery photos.
                </h1>

                <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-black/20 p-6 md:p-8">
                  <div className="grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                        Gallery
                      </label>
                      <select
                        value={galleryType}
                        onChange={(e) => setGalleryType(e.target.value)}
                        className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-white outline-none"
                      >
                        {galleryTypes.map((type) => (
                          <option key={type} value={type} className="bg-black">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                        Caption
                      </label>
                      <input
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Optional caption"
                        className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-white outline-none placeholder:text-white/25"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                        Images
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          setFiles(e.target.files ? Array.from(e.target.files) : [])
                        }
                        className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#f5f0e7] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.2em] file:text-black"
                      />
                    </div>
                  </div>

                  {files.length > 0 && (
                    <p className="mt-5 text-sm text-white/45">
                      {files.length} photo{files.length === 1 ? "" : "s"} selected.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-6 w-full rounded-full bg-[#f5f0e7] px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition active:scale-[0.99] disabled:opacity-60"
                  >
                    {uploading
                      ? `Uploading ${files.length || ""}...`
                      : "Upload Gallery Photos"}
                  </button>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03]"
                    >
                      <div className="relative aspect-[4/5] bg-black">
                        <img
                          src={photo.image_url}
                          alt={photo.caption || photo.gallery_type}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="p-6">
                        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
                          {photo.gallery_type}
                        </p>

                        <p className="mt-3 text-white/65">
                          {photo.caption || "No caption"}
                        </p>

                        <button
                          type="button"
                          onClick={() => deletePhoto(photo)}
                          className="mt-5 rounded-full border border-red-400/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {photos.length === 0 && (
                    <PanelText>No gallery photos uploaded yet.</PanelText>
                  )}
                </div>
              </>
            )}

            {activeTab !== "Overview" &&
              activeTab !== "Bookings" &&
              activeTab !== "Galleries" && (
                <>
                  <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
                    {activeTab}
                  </p>

                  <h1 className="mt-6 text-5xl font-light tracking-[-0.06em] md:text-7xl">
                    {activeTab}
                  </h1>

                  <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-10">
                    <p className="max-w-2xl text-lg leading-9 text-white/50">
                      This section is ready for custom functionality.
                    </p>
                  </div>
                </>
              )}
          </section>
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>
      <h2 className="mt-8 text-6xl font-light tracking-[-0.06em]">{value}</h2>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </p>
      <p className="mt-4 text-lg text-white/70">{value || "Not provided"}</p>
    </div>
  );
}

function PanelText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-white/50">
      {children}
    </div>
  );
}
