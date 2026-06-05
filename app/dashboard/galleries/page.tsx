"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Copy,
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

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type ClientGallery = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
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
  client_id: string | null;
  file_name: string | null;
  file_path: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  sort_order: number | null;
  is_cover: boolean | null;
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

const sections = [
  "overview",
  "clients",
  "bookings",
  "calendar",
  "contracts",
  "invoices",
  "galleries",
  "finance",
  "expenses",
];

export default function DashboardGalleriesPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientGalleries, setClientGalleries] = useState<ClientGallery[]>([]);
  const [clientGalleryPhotos, setClientGalleryPhotos] = useState<
    ClientGalleryPhoto[]
  >([]);

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

  const [deliverySearch, setDeliverySearch] = useState("");
  const [selectedDeliveryGalleryId, setSelectedDeliveryGalleryId] =
    useState("");
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [deliveryUploading, setDeliveryUploading] = useState(false);
  const [deliveryProgress, setDeliveryProgress] = useState({
    total: 0,
    uploaded: 0,
    failed: 0,
  });

  const [deliveryCreateForm, setDeliveryCreateForm] = useState({
    client_id: "",
    title: "",
    description: "",
    status: "draft",
  });

  useEffect(() => {
    loadAllGalleryData();
  }, []);

  async function loadAllGalleryData() {
    setLoading(true);

    const [photoResult, clientResult, galleryResult, galleryPhotoResult] =
      await Promise.all([
        supabase
          .from("gallery_photos")
          .select("id, gallery_type, image_url, caption, created_at")
          .order("created_at", { ascending: false }),

        supabase
          .from("clients")
          .select("id, full_name, email")
          .order("created_at", { ascending: false }),

        supabase
          .from("client_galleries")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("client_gallery_photos")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);

    if (photoResult.error) {
      alert(photoResult.error.message);
      setLoading(false);
      return;
    }

    if (clientResult.error) {
      alert(clientResult.error.message);
      setLoading(false);
      return;
    }

    if (galleryResult.error) {
      alert(galleryResult.error.message);
      setLoading(false);
      return;
    }

    if (galleryPhotoResult.error) {
      alert(galleryPhotoResult.error.message);
      setLoading(false);
      return;
    }

    setPhotos((photoResult.data || []) as GalleryPhoto[]);
    setClients((clientResult.data || []) as Client[]);
    setClientGalleries((galleryResult.data || []) as ClientGallery[]);
    setClientGalleryPhotos(
      (galleryPhotoResult.data || []) as ClientGalleryPhoto[]
    );

    if (!selectedDeliveryGalleryId && galleryResult.data?.[0]?.id) {
      setSelectedDeliveryGalleryId(galleryResult.data[0].id);
    }

    setLoading(false);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }

  function handleDeliveryFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setDeliveryFiles(files);
    setDeliveryProgress({
      total: files.length,
      uploaded: 0,
      failed: 0,
    });
  }

  async function uploadPhoto() {
    if (!selectedFile) {
      alert("Choose an image first.");
      return;
    }

    setUploading(true);
    setNotice("");

    const fileExtension = selectedFile.name.split(".").pop() || "jpg";
    const safeFileName = makeSafeFileName(
      selectedFile.name.replace(/\.[^/.]+$/, "")
    );

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
    setNotice("Homepage gallery image uploaded successfully.");
    await loadAllGalleryData();

    const fileInput = document.getElementById(
      "gallery-upload"
    ) as HTMLInputElement | null;

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
    setNotice("Homepage gallery photo updated.");
    await loadAllGalleryData();
  }

  async function deletePhoto(photo: GalleryPhoto) {
    const confirmDelete = confirm("Delete this homepage gallery photo?");
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

    setNotice("Homepage gallery photo deleted.");
    await loadAllGalleryData();
  }

  async function createClientGallery() {
    const client = clients.find(
      (item) => item.id === deliveryCreateForm.client_id
    );

    if (!client) {
      alert("Choose a client first.");
      return;
    }

    setNotice("");

    const { data, error } = await supabase
      .from("client_galleries")
      .insert({
        client_id: client.id,
        client_name: client.full_name,
        client_email: client.email,
        title:
          deliveryCreateForm.title ||
          `${client.full_name || "Client"} Gallery`,
        description: deliveryCreateForm.description || null,
        status: deliveryCreateForm.status || "draft",
      })
      .select("*")
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setDeliveryCreateForm({
      client_id: "",
      title: "",
      description: "",
      status: "draft",
    });

    setSelectedDeliveryGalleryId(data.id);
    setNotice("Client delivery gallery created.");
    await loadAllGalleryData();
  }

  async function uploadDeliveryPhotos() {
    const gallery = selectedDeliveryGallery;

    if (!gallery) {
      alert("Choose or create a client gallery first.");
      return;
    }

    if (deliveryFiles.length === 0) {
      alert("Choose delivery photos first.");
      return;
    }

    setDeliveryUploading(true);
    setNotice("");
    setDeliveryProgress({
      total: deliveryFiles.length,
      uploaded: 0,
      failed: 0,
    });

    const existingCount = clientGalleryPhotos.filter(
      (photo) => photo.gallery_id === gallery.id
    ).length;

    let uploaded = 0;
    let failed = 0;
    let firstUploadedUrl: string | null = null;

    for (let index = 0; index < deliveryFiles.length; index += 1) {
      const file = deliveryFiles[index];

      try {
        const extension = file.name.split(".").pop() || "jpg";
        const safeName = makeSafeFileName(file.name.replace(/\.[^/.]+$/, ""));
        const filePath = `client-delivery/${gallery.id}/${Date.now()}-${index}-${safeName}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(GALLERY_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/jpeg",
          });

        if (uploadError) {
          failed += 1;
          setDeliveryProgress({
            total: deliveryFiles.length,
            uploaded,
            failed,
          });
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from(GALLERY_BUCKET)
          .getPublicUrl(filePath);

        const fileUrl = publicUrlData.publicUrl;

        const { error: insertError } = await supabase
          .from("client_gallery_photos")
          .insert({
            gallery_id: gallery.id,
            client_id: gallery.client_id,
            file_name: file.name,
            file_path: filePath,
            file_url: fileUrl,
            file_type: file.type || null,
            file_size: file.size,
            sort_order: existingCount + index,
            is_cover: existingCount === 0 && uploaded === 0,
          });

        if (insertError) {
          failed += 1;
          setDeliveryProgress({
            total: deliveryFiles.length,
            uploaded,
            failed,
          });
          continue;
        }

        if (!firstUploadedUrl) {
          firstUploadedUrl = fileUrl;
        }

        uploaded += 1;

        setDeliveryProgress({
          total: deliveryFiles.length,
          uploaded,
          failed,
        });
      } catch {
        failed += 1;

        setDeliveryProgress({
          total: deliveryFiles.length,
          uploaded,
          failed,
        });
      }
    }

    if (!gallery.cover_image_url && firstUploadedUrl) {
      await supabase
        .from("client_galleries")
        .update({
          cover_image_url: firstUploadedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gallery.id);
    }

    setDeliveryUploading(false);
    setDeliveryFiles([]);

    const fileInput = document.getElementById(
      "delivery-gallery-upload"
    ) as HTMLInputElement | null;

    if (fileInput) fileInput.value = "";

    setNotice(
      failed > 0
        ? `Upload finished: ${uploaded} uploaded, ${failed} failed.`
        : `Upload finished: ${uploaded} photos uploaded.`
    );

    await loadAllGalleryData();
  }

  async function updateClientGalleryStatus(
    gallery: ClientGallery,
    status: string
  ) {
    setSavingId(gallery.id);
    setNotice("");

    const updateData: Record<string, string | null> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("client_galleries")
      .update(updateData)
      .eq("id", gallery.id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Client gallery marked ${status}.`);
    await loadAllGalleryData();
  }

  async function deleteClientGallery(gallery: ClientGallery) {
    const confirmDelete = confirm(
      `Delete ${gallery.title || "this client gallery"}?`
    );

    if (!confirmDelete) return;

    setDeletingId(gallery.id);
    setNotice("");

    const { error } = await supabase
      .from("client_galleries")
      .delete()
      .eq("id", gallery.id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    if (selectedDeliveryGalleryId === gallery.id) {
      setSelectedDeliveryGalleryId("");
    }

    setNotice("Client delivery gallery deleted.");
    await loadAllGalleryData();
  }

  async function copyGalleryLink(gallery: ClientGallery) {
    const url = getClientGalleryUrl(gallery);
    await navigator.clipboard.writeText(url);
    setNotice("Client gallery link copied.");
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

  const filteredClientGalleries = useMemo(() => {
    const term = deliverySearch.toLowerCase().trim();

    return clientGalleries.filter((gallery) => {
      const searchable = [
        gallery.client_name,
        gallery.client_email,
        gallery.title,
        gallery.description,
        gallery.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [clientGalleries, deliverySearch]);

  const selectedDeliveryGallery: ClientGallery | undefined = useMemo(() => {
    return clientGalleries.find((gallery) => {
      return gallery.id === selectedDeliveryGalleryId;
    });
  }, [clientGalleries, selectedDeliveryGalleryId]);

  const selectedDeliveryPhotos: ClientGalleryPhoto[] = useMemo(() => {
    if (!selectedDeliveryGalleryId) {
      return [];
    }

    return clientGalleryPhotos.filter((photo) => {
      return photo.gallery_id === selectedDeliveryGalleryId;
    });
  }, [clientGalleryPhotos, selectedDeliveryGalleryId]);

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
          Manage homepage portfolio images and create private client delivery
          galleries from the same Camvelle gallery system.
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

      {notice && (
        <div className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
          {notice}
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Homepage Photos" value={String(photos.length)} />
        <StatCard title="Client Galleries" value={String(clientGalleries.length)} />
        <StatCard title="Delivery Photos" value={String(clientGalleryPhotos.length)} />
        <StatCard
          title="Selected Gallery"
          value={
            selectedDeliveryGallery?.title ||
            selectedDeliveryGallery?.client_name ||
            "None"
          }
        />
      </div>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Client Delivery</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Private
              <br />
              galleries.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
              Create a client gallery, upload 100–150 delivery photos in one
              batch, publish the gallery, then copy the private client link.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
            <Upload size={18} />
          </div>
        </div>

        <div className="mt-10 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <CamvelleInnerPanel className="p-5">
            <CamvelleEyebrow>Create Client Gallery</CamvelleEyebrow>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Client
                </label>

                <select
                  value={deliveryCreateForm.client_id}
                  onChange={(e) =>
                    setDeliveryCreateForm({
                      ...deliveryCreateForm,
                      client_id: e.target.value,
                    })
                  }
                  className="w-full bg-transparent text-white outline-none"
                >
                  <option value="" className="bg-black">
                    Select client
                  </option>

                  {clients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-black">
                      {client.full_name || client.email || "Unnamed Client"}
                    </option>
                  ))}
                </select>
              </div>

              <InputBubble
                label="Gallery Title"
                value={deliveryCreateForm.title}
                placeholder="Example: Smith Family Gallery"
                onChange={(value) =>
                  setDeliveryCreateForm({
                    ...deliveryCreateForm,
                    title: value,
                  })
                }
              />

              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={deliveryCreateForm.description}
                  onChange={(e) =>
                    setDeliveryCreateForm({
                      ...deliveryCreateForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional message for the client gallery..."
                  className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                />
              </div>

              <button
                type="button"
                onClick={createClientGallery}
                className={camvelleCreamButton}
              >
                Create Client Gallery
              </button>
            </div>
          </CamvelleInnerPanel>

          <CamvelleInnerPanel className="p-5">
            <CamvelleEyebrow>Upload Delivery Photos</CamvelleEyebrow>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Delivery Gallery
                </label>

                <select
                  value={selectedDeliveryGalleryId}
                  onChange={(e) => setSelectedDeliveryGalleryId(e.target.value)}
                  className="w-full bg-transparent text-white outline-none"
                >
                  <option value="" className="bg-black">
                    Select gallery
                  </option>

                  {clientGalleries.map((gallery) => (
                    <option key={gallery.id} value={gallery.id} className="bg-black">
                      {gallery.title || "Client Gallery"} -{" "}
                      {gallery.client_name || gallery.client_email || "Client"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Photos
                </label>

                <input
                  id="delivery-gallery-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDeliveryFileChange}
                  className="w-full text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-[#f5f0e7] file:px-5 file:py-3 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.25em] file:text-black"
                />

                <p className="mt-3 text-xs leading-6 text-white/40">
                  Selected: {deliveryFiles.length} photo
                  {deliveryFiles.length === 1 ? "" : "s"}
                </p>
              </div>

              {deliveryProgress.total > 0 && (
                <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/50">
                  <p>
                    Uploaded: {deliveryProgress.uploaded} /{" "}
                    {deliveryProgress.total}
                  </p>
                  <p>Failed: {deliveryProgress.failed}</p>
                </div>
              )}

              <button
                type="button"
                onClick={uploadDeliveryPhotos}
                disabled={deliveryUploading}
                className={`${camvelleCreamButton} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {deliveryUploading ? "Uploading..." : "Upload Delivery Photos"}
              </button>
            </div>
          </CamvelleInnerPanel>
        </div>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Client Gallery Library</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Delivery
              <br />
              links.
            </h2>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <Search size={16} className="text-white/35" />

            <input
              value={deliverySearch}
              onChange={(e) => setDeliverySearch(e.target.value)}
              placeholder="Search client galleries..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        {loading && <p className="mt-10 text-white/50">Loading client galleries...</p>}

        {!loading && filteredClientGalleries.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
            No client delivery galleries found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-5 xl:grid-cols-2">
          {filteredClientGalleries.map((gallery) => {
            const count = clientGalleryPhotos.filter(
              (photo) => photo.gallery_id === gallery.id
            ).length;

            return (
              <CamvelleInnerPanel key={gallery.id} className="overflow-hidden p-0">
                {gallery.cover_image_url ? (
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-t-[2.4rem] bg-black/30">
                    <img
                      src={gallery.cover_image_url}
                      alt={gallery.title || "Client Gallery"}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-t-[2.4rem] bg-black/30 text-white/35">
                    No cover image
                  </div>
                )}

                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CamvelleStatusPill status={gallery.status || "draft"} />

                    <p className="text-xs text-white/35">
                      {count} photo{count === 1 ? "" : "s"}
                    </p>
                  </div>

                  <h3 className="mt-5 break-words text-4xl font-light tracking-[-0.06em]">
                    {gallery.title || "Client Gallery"}
                  </h3>

                  <div className="mt-5 grid gap-2 text-sm leading-7 text-white/50">
                    <p>
                      <span className="text-white/30">Client:</span>{" "}
                      {gallery.client_name || "Not provided"}
                    </p>

                    <p>
                      <span className="text-white/30">Email:</span>{" "}
                      {gallery.client_email || "Not provided"}
                    </p>

                    <p>
                      <span className="text-white/30">Created:</span>{" "}
                      {formatDate(gallery.created_at)}
                    </p>

                    {gallery.description && (
                      <p className="whitespace-pre-wrap">
                        <span className="text-white/30">Description:</span>{" "}
                        {gallery.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-5">
                    <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                      Gallery Status
                    </label>

                    <select
                      value={gallery.status || "draft"}
                      disabled={savingId === gallery.id}
                      onChange={(e) =>
                        updateClientGalleryStatus(gallery, e.target.value)
                      }
                      className="w-full bg-transparent text-white outline-none disabled:opacity-50"
                    >
                      <option value="draft" className="bg-black">
                        Draft
                      </option>
                      <option value="published" className="bg-black">
                        Published
                      </option>
                      <option value="delivered" className="bg-black">
                        Delivered
                      </option>
                      <option value="archived" className="bg-black">
                        Archived
                      </option>
                    </select>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDeliveryGalleryId(gallery.id)}
                      className={camvelleGhostButton}
                    >
                      Select Gallery
                    </button>

                    <button
                      type="button"
                      onClick={() => copyGalleryLink(gallery)}
                      className={camvelleGhostButton}
                    >
                      <Copy size={15} />
                      Copy Link
                    </button>

                    <a
                      href={getClientGalleryUrl(gallery)}
                      target="_blank"
                      rel="noreferrer"
                      className={camvelleCreamButton}
                    >
                      Open Gallery
                    </a>

                    <button
                      type="button"
                      onClick={() => deleteClientGallery(gallery)}
                      disabled={deletingId === gallery.id}
                      className="inline-flex items-center justify-center gap-3 rounded-full border border-red-400/20 bg-red-500/10 px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </CamvelleInnerPanel>
            );
          })}
        </div>
      </CamvellePanel>

      {selectedDeliveryGallery && (
        <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <CamvelleEyebrow>Selected Delivery Gallery</CamvelleEyebrow>

              <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
                Gallery
                <br />
                controls.
              </h2>

              <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
                {selectedDeliveryGallery.title || "Client Gallery"} has{" "}
                {selectedDeliveryPhotos.length} uploaded photo
                {selectedDeliveryPhotos.length === 1 ? "" : "s"}. Individual
                delivery photos are not rendered inside the dashboard to keep
                this page fast.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => copyGalleryLink(selectedDeliveryGallery)}
                className={camvelleGhostButton}
              >
                <Copy size={15} />
                Copy Link
              </button>

              <a
                href={getClientGalleryUrl(selectedDeliveryGallery)}
                target="_blank"
                rel="noreferrer"
                className={camvelleCreamButton}
              >
                Open Client Gallery
              </a>
            </div>
          </div>
        </CamvellePanel>
      )}

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Homepage Galleries</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Website
              <br />
              portfolio.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
              This section controls images shown across your public Camvelle
              homepage and service galleries.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
            <ImagePlus size={18} />
          </div>
        </div>

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
          {uploading ? "Uploading..." : "Upload Homepage Image"}
        </button>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Homepage Gallery Library</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Manage
              <br />
              portfolio.
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
            No homepage gallery photos found.
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
                    loading="lazy"
                    decoding="async"
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

function InputBubble({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
      />
    </div>
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

function makeSafeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "photo"
  );
}

function getClientGalleryUrl(gallery: ClientGallery) {
  const path = `/gallery/${gallery.share_token}`;

  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
