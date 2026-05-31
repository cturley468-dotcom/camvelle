"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const sections = [
  "Overview",
  "Clients",
  "Bookings",
  "Calendar",
  "Invoices",
  "Contracts",
  "Galleries",
  "Finance",
];

const galleryTypes = [
  "proposals",
  "couples",
  "families",
  "portraits",
  "business",
  "real-estate",
  "automotive",
  "events",
];

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("Overview");
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

  const estimatedRevenue = useMemo(() => {
    return inquiries.length * 400;
  }, [inquiries.length]);

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
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/backgrounds/camvelle-background.png')",
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      {/* HEADER */}
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

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-white/10 bg-[#f5f0e7] px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-black transition hover:scale-[1.02]"
        >
          Logout
        </button>
      </header>

      <section className="relative z-10 px-5 pb-24 pt-4 md:px-10">
        <div className="mx-auto max-w-7xl">
          {/* TOP DASHBOARD CARD */}
          <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  CamVelle Studio HQ
                </p>

                <h1 className="mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
                  Manage the
                  <br />
                  creative flow.
                </h1>

                <p className="mt-7 max-w-3xl text-lg leading-8 text-white/50">
                  Bookings, clients, invoices, contracts, galleries, and reports —
                  organized for your photography business.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                  Dashboard Section
                </label>

                <select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/[0.035] px-6 py-5 text-sm uppercase tracking-[0.25em] text-white outline-none backdrop-blur-xl"
                >
                  {sections.map((section) => (
                    <option key={section} value={section} className="bg-black">
                      {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <StatCard title="Inquiries" value={String(inquiries.length)} />
            <StatCard title="Gallery Photos" value={String(photos.length)} />
            <StatCard title="Estimated Revenue" value={`$${estimatedRevenue}`} />
            <StatCard title="Open Invoices" value="0" />
          </div>

          {/* CONTENT */}
          <div className="mt-6">
            {activeSection === "Overview" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Overview
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Today’s studio pulse.
                </h2>

                <div className="mt-10 grid gap-5 lg:grid-cols-3">
                  <MiniPanel
                    title="Next Priority"
                    text="Review new inquiries and move qualified clients into the client workflow."
                  />
                  <MiniPanel
                    title="Client Flow"
                    text="Inquiry → Client Card → Contract → Invoice → Calendar → Gallery."
                  />
                  <MiniPanel
                    title="Reports"
                    text="Monthly and yearly reports will be generated from client cards, invoices, and payment records."
                  />
                </div>
              </GlassPanel>
            )}

            {activeSection === "Clients" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Clients
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Client cards.
                </h2>

                <div className="mt-10 grid gap-5">
                  {loading && <PanelText>Loading clients...</PanelText>}

                  {!loading && inquiries.length === 0 && (
                    <PanelText>No client inquiries yet.</PanelText>
                  )}

                  {inquiries.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.4em] text-white/30">
                            Client Profile
                          </p>

                          <h3 className="mt-5 text-4xl font-light tracking-[-0.06em]">
                            {client.full_name || "Unnamed Client"}
                          </h3>

                          <p className="mt-3 text-white/45">
                            {client.service_type || "Session type not selected"}
                          </p>

                          <div className="mt-7 grid gap-4 md:grid-cols-2">
                            <InfoCard label="Email" value={client.email} />
                            <InfoCard label="Phone" value={client.phone} />
                            <InfoCard label="Preferred Date" value={client.preferred_date} />
                            <InfoCard label="Status" value="Inquiry" />
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <FileStatus title="Invoice" status="Not Created" detail="$0.00 due" />
                          <FileStatus title="Payment" status="Pending" detail="Deposit not recorded" />
                          <FileStatus title="Contract" status="Not Sent" detail="Agreement pending" />
                          <FileStatus title="Report Filing" status="Unfiled" detail="Monthly / yearly report ready when complete" />
                        </div>
                      </div>

                      {client.message && (
                        <div className="mt-7 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
                          <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
                            Notes
                          </p>
                          <p className="mt-4 whitespace-pre-wrap leading-8 text-white/55">
                            {client.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}

            {activeSection === "Bookings" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Bookings
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Incoming inquiries.
                </h2>

                <div className="mt-10 space-y-5">
                  {inquiries.map((item) => (
                    <MiniPanel
                      key={item.id}
                      title={item.full_name || "Unnamed Inquiry"}
                      text={`${item.service_type || "Session"} — ${item.email || "No email"}`}
                    />
                  ))}

                  {inquiries.length === 0 && <PanelText>No bookings yet.</PanelText>}
                </div>
              </GlassPanel>
            )}

            {activeSection === "Calendar" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Calendar
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Mobile-first schedule.
                </h2>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                  <MiniPanel title="Day View" text="A focused mobile view for today’s sessions." />
                  <MiniPanel title="Week View" text="Upcoming client work, edits, and delivery dates." />
                  <MiniPanel title="Month View" text="High-level booking and availability overview." />
                </div>
              </GlassPanel>
            )}

            {activeSection === "Invoices" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Invoices
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Billing center.
                </h2>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                  <MiniPanel title="Draft" text="Create invoices from client cards." />
                  <MiniPanel title="Sent" text="Track invoices sent to clients." />
                  <MiniPanel title="Paid" text="Payments will feed monthly and yearly reports." />
                </div>
              </GlassPanel>
            )}

            {activeSection === "Contracts" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Contracts
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Agreement files.
                </h2>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                  <MiniPanel title="Proposal Agreement" text="Store signed proposal session agreements." />
                  <MiniPanel title="Portrait Agreement" text="Store signed portrait and family session agreements." />
                  <MiniPanel title="Commercial Agreement" text="Store business, real estate, and automotive contracts." />
                </div>
              </GlassPanel>
            )}

            {activeSection === "Galleries" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Galleries
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Upload gallery photos.
                </h2>

                <div className="mt-10 rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl">
                  <div className="grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                        Gallery
                      </label>
                      <select
                        value={galleryType}
                        onChange={(e) => setGalleryType(e.target.value)}
                        className="w-full rounded-full border border-white/10 bg-white/[0.035] px-5 py-4 text-white outline-none"
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
                        className="w-full rounded-full border border-white/10 bg-white/[0.035] px-5 py-4 text-white outline-none placeholder:text-white/25"
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
                        className="w-full rounded-full border border-white/10 bg-white/[0.035] px-5 py-4 text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#f5f0e7] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.2em] file:text-black"
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
                    className="mt-6 w-full rounded-full bg-[#f5f0e7] px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Upload Gallery Photos"}
                  </button>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.035] backdrop-blur-xl"
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.caption || photo.gallery_type}
                        className="aspect-[4/5] w-full object-cover"
                      />

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
                </div>
              </GlassPanel>
            )}

            {activeSection === "Finance" && (
              <GlassPanel>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Finance
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Reports and revenue.
                </h2>

                <div className="mt-10 grid gap-5 md:grid-cols-4">
                  <StatCard title="This Month" value="$0" />
                  <StatCard title="This Year" value={`$${estimatedRevenue}`} />
                  <StatCard title="Outstanding" value="$0" />
                  <StatCard title="Avg. Booking" value="$400" />
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-2">
                  <MiniPanel
                    title="Monthly Report"
                    text="Client cards, invoices, payments, and contracts will feed monthly financial reports."
                  />
                  <MiniPanel
                    title="Yearly Report"
                    text="Annual revenue, sessions, outstanding balances, and average booking value."
                  />
                </div>
              </GlassPanel>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
      {children}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>
      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">{value}</h3>
    </div>
  );
}

function MiniPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
      <h3 className="text-2xl font-light tracking-[-0.04em]">{title}</h3>
      <p className="mt-5 leading-8 text-white/50">{text}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
      <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-white/65">{value || "Not provided"}</p>
    </div>
  );
}

function FileStatus({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
          {title}
        </p>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-white/45">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm text-white/55">{detail}</p>
    </div>
  );
}

function PanelText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-white/50 backdrop-blur-xl">
      {children}
    </div>
  );
}
