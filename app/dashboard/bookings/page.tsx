"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Pencil,
  Save,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";


type Booking = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service_type: string | null;
  preferred_date: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
};

const sections = [
  "overview",
  "clients",
  "calendar",
  "galleries",
  "finance",
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    service_type: "",
    preferred_date: "",
    message: "",
    status: "",
  });

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  }

  function startEdit(booking: Booking) {
    setNotice("");
    setOpenId(booking.id);
    setEditingId(booking.id);

    setEditForm({
      full_name: booking.full_name || "",
      email: booking.email || "",
      phone: booking.phone || "",
      service_type: booking.service_type || "",
      preferred_date: booking.preferred_date || "",
      message: booking.message || "",
      status: booking.status || "new",
    });
  }

  async function saveBooking(id: string) {
    setSavingId(id);
    setNotice("");

    const { error } = await supabase
      .from("inquiries")
      .update({
        full_name: editForm.full_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        service_type: editForm.service_type || null,
        preferred_date: editForm.preferred_date || null,
        message: editForm.message || null,
        status: editForm.status || "new",
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setNotice("Booking updated successfully.");
    await loadBookings();
  }

  async function deleteBooking(id: string) {
    const confirmDelete = confirm("Delete this booking request?");
    if (!confirmDelete) return;

    setDeletingId(id);
    setNotice("");

    const { error } = await supabase.from("inquiries").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setOpenId(null);
    setEditingId(null);
    setNotice("Booking deleted successfully.");
    await loadBookings();
  }

  async function createClientFromBooking(booking: Booking) {
    setCreatingId(booking.id);
    setNotice("");

    const clientNotes = [
      booking.service_type ? `Session Type: ${booking.service_type}` : "",
      booking.preferred_date ? `Preferred Date: ${booking.preferred_date}` : "",
      booking.message ? booking.message : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { error: clientError } = await supabase.from("clients").insert({
      full_name: booking.full_name,
      email: booking.email,
      phone: booking.phone,
      notes: clientNotes || null,
    });

    if (clientError) {
      setCreatingId(null);
      alert(clientError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", booking.id);

    setCreatingId(null);

    if (deleteError) {
      alert(deleteError.message);
      await loadBookings();
      return;
    }

    setOpenId(null);
    setEditingId(null);
    setNotice("Client created and booking removed from queue.");
    await loadBookings();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredBookings = useMemo(() => {
    const term = search.toLowerCase();

    return bookings.filter((booking) => {
      return (
        booking.full_name?.toLowerCase().includes(term) ||
        booking.email?.toLowerCase().includes(term) ||
        booking.phone?.toLowerCase().includes(term) ||
        booking.service_type?.toLowerCase().includes(term) ||
        booking.preferred_date?.toLowerCase().includes(term) ||
        booking.message?.toLowerCase().includes(term) ||
        booking.status?.toLowerCase().includes(term)
      );
    });
  }, [bookings, search]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/backgrounds/camvelle-background.png')",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>

      <header className="relative z-[9999] flex items-center justify-between px-5 py-6 md:px-10">
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

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-white/10 bg-[#f5f0e7] px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-black transition hover:scale-[1.02]"
        >
          Logout
        </button>
      </header>

      <section className="relative z-10 px-4 pb-24 pt-6 md:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-center transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-14">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Booking Management
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Booking
              <br />
              Inquiries
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              Recent Inquiries
            </p>

            <div className="mx-auto mt-14 w-full max-w-sm">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                Navigate
              </label>

              <select
                defaultValue="bookings"
                onChange={(e) => {
                  if (e.target.value === "overview") {
                    window.location.href = "/dashboard";
                    return;
                  }

                  if (e.target.value) {
                    window.location.href = `/dashboard/${e.target.value}`;
                  }
                }}
                className="w-full rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white outline-none transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <option value="bookings" className="bg-black">
                  Bookings
                </option>

                {sections.map((section) => (
                  <option key={section} value={section} className="bg-black">
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mx-auto mt-6 grid w-full gap-5 md:grid-cols-2">
            <StatCard title="New Requests" value={String(bookings.length)} />
            <StatCard
              title="Visible Results"
              value={String(filteredBookings.length)}
            />
          </div>

          <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Booking Requests
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Inquiry queue.
                </h2>
              </div>

              <div className="w-full max-w-md rounded-full border border-white/10 bg-white/[0.025] px-6 py-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bookings..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                />
              </div>
            </div>

            {notice && (
              <div className="mt-8 rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
                {notice}
              </div>
            )}

            {loading && (
              <p className="mt-10 text-white/50">Loading bookings...</p>
            )}

            {!loading && filteredBookings.length === 0 && (
              <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-7 text-white/50">
                No booking requests found.
              </div>
            )}

            <div className="mt-10 grid gap-4">
              {filteredBookings.map((booking, index) => {
                const isOpen = openId === booking.id;
                const isEditing = editingId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className="mx-auto w-full max-w-3xl rounded-[2.25rem] border border-white/10 bg-white/[0.035] p-5 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                          {String(index + 1).padStart(2, "0")} / Request
                        </p>

                        <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] md:text-4xl">
                          {booking.full_name || "Unnamed Request"}
                        </h3>

                        <div className="mt-3 grid gap-1 text-sm leading-6 text-white/50">
                          <p>{booking.service_type || "Session type not selected"}</p>
                          <p>{booking.email || "No email"}</p>
                          <p>{booking.phone || "No phone"}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(isOpen ? null : booking.id);
                          setEditingId(null);
                          setNotice("");
                        }}
                        className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:border-white/25 hover:bg-white hover:text-black"
                      >
                        {isOpen ? "Close" : "Open"}
                      </button>
                    </div>

                    {isOpen && !isEditing && (
                      <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
                        <div className="grid gap-4 text-sm leading-7 text-white/55">
                          <p>
                            <span className="text-white/30">Name:</span>{" "}
                            {booking.full_name || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Email:</span>{" "}
                            {booking.email || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Phone:</span>{" "}
                            {booking.phone || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Session:</span>{" "}
                            {booking.service_type || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Preferred Date:</span>{" "}
                            {booking.preferred_date || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Status:</span>{" "}
                            {booking.status || "new"}
                          </p>

                          <p>
                            <span className="text-white/30">Created:</span>{" "}
                            {booking.created_at
                              ? new Date(booking.created_at).toLocaleDateString()
                              : "Not provided"}
                          </p>

                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                              Details
                            </p>

                            <p className="mt-3 whitespace-pre-wrap text-white/55">
                              {booking.message || "No details saved."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <IconButton
                            label={
                              creatingId === booking.id
                                ? "Creating"
                                : "Create Client"
                            }
                            icon={<UserPlus size={16} />}
                            onClick={() => createClientFromBooking(booking)}
                            disabled={creatingId === booking.id}
                          />

                          <IconButton
                            label="Edit"
                            icon={<Pencil size={16} />}
                            onClick={() => startEdit(booking)}
                          />

                          <IconButton
                            label={
                              deletingId === booking.id ? "Deleting" : "Delete"
                            }
                            danger
                            icon={<Trash2 size={16} />}
                            onClick={() => deleteBooking(booking.id)}
                            disabled={deletingId === booking.id}
                          />
                        </div>
                      </div>
                    )}

                    {isOpen && isEditing && (
                      <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
                        <div className="grid gap-4">
                          <EditInput
                            label="Full Name"
                            value={editForm.full_name}
                            onChange={(value) =>
                              setEditForm({ ...editForm, full_name: value })
                            }
                          />

                          <EditInput
                            label="Email"
                            value={editForm.email}
                            onChange={(value) =>
                              setEditForm({ ...editForm, email: value })
                            }
                          />

                          <EditInput
                            label="Phone"
                            value={editForm.phone}
                            onChange={(value) =>
                              setEditForm({ ...editForm, phone: value })
                            }
                          />

                          <EditInput
                            label="Session Type"
                            value={editForm.service_type}
                            onChange={(value) =>
                              setEditForm({ ...editForm, service_type: value })
                            }
                          />

                          <EditInput
                            label="Preferred Date"
                            type="date"
                            value={editForm.preferred_date}
                            onChange={(value) =>
                              setEditForm({
                                ...editForm,
                                preferred_date: value,
                              })
                            }
                          />

                          <EditInput
                            label="Status"
                            value={editForm.status}
                            onChange={(value) =>
                              setEditForm({ ...editForm, status: value })
                            }
                          />

                          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
                            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                              Details
                            </label>

                            <textarea
                              rows={5}
                              value={editForm.message}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  message: e.target.value,
                                })
                              }
                              className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <IconButton
                            label={savingId === booking.id ? "Saving" : "Save"}
                            icon={<Save size={16} />}
                            onClick={() => saveBooking(booking.id)}
                            disabled={savingId === booking.id}
                          />

                          <IconButton
                            label="Cancel"
                            icon={<X size={16} />}
                            onClick={() => setEditingId(null)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="mx-auto w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">
        {value}
      </h3>
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
      />
    </div>
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
      className={`flex h-12 w-12 items-center justify-center rounded-full border text-white/65 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          : "border-white/10 bg-white/[0.035] hover:bg-white hover:text-black"
      }`}
    >
      {icon}
    </button>
  );
}
