"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pencil, Save, Trash2, UserPlus, X } from "lucide-react";
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

const sections = ["overview", "clients", "calendar", "contracts", "invoices", "finance", "expenses", ];


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
        <CamvelleEyebrow>Booking Management</CamvelleEyebrow>

        <CamvelleHeading>
          Booking
          <br />
          Inquiries
        </CamvelleHeading>

        <CamvelleBody>Review recent Camvelle Creative booking requests.</CamvelleBody>

        <div className="mx-auto mt-12 w-full max-w-xl text-left">
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
            className="w-full rounded-full border border-white/10 bg-black/20 px-7 py-5 text-[11px] font-bold uppercase tracking-[0.35em] text-white outline-none transition hover:border-white/20 hover:bg-black/30"
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
      </CamvellePanel>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <StatCard title="New Requests" value={String(bookings.length)} />
        <StatCard title="Visible Results" value={String(filteredBookings.length)} />
      </div>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Booking Requests</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Inquiry
              <br />
              queue.
            </h2>
          </div>

          <div className="w-full max-w-md rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        {notice && (
          <div className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {loading && <p className="mt-10 text-white/50">Loading bookings...</p>}

        {!loading && filteredBookings.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
            No booking requests found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-4">
          {filteredBookings.map((booking, index) => {
            const isOpen = openId === booking.id;
            const isEditing = editingId === booking.id;

            return (
              <CamvelleInnerPanel
                key={booking.id}
                className="mx-auto w-full max-w-3xl p-5 transition hover:border-white/20 md:p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                      {String(index + 1).padStart(2, "0")} / Request
                    </p>

                    <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] text-white md:text-4xl">
                      {booking.full_name || "Unnamed Request"}
                    </h3>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <CamvelleStatusPill status={booking.status || "New"} />
                    </div>

                    <div className="mt-4 grid gap-1 text-sm leading-6 text-white/50">
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
                    className={camvelleGhostButton}
                  >
                    {isOpen ? "Close" : "Open"}
                  </button>
                </div>

                {isOpen && !isEditing && (
                  <CamvelleInnerPanel className="mt-6 p-5">
                    <div className="grid gap-4 text-sm leading-7 text-white/55">
                      <DetailLine label="Name" value={booking.full_name} />
                      <DetailLine label="Email" value={booking.email} />
                      <DetailLine label="Phone" value={booking.phone} />
                      <DetailLine label="Session" value={booking.service_type} />
                      <DetailLine label="Preferred Date" value={booking.preferred_date} />
                      <DetailLine label="Status" value={booking.status || "new"} />
                      <DetailLine
                        label="Created"
                        value={
                          booking.created_at
                            ? new Date(booking.created_at).toLocaleDateString()
                            : null
                        }
                      />

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
                        label={creatingId === booking.id ? "Creating" : "Create Client"}
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
                        label={deletingId === booking.id ? "Deleting" : "Delete"}
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={() => deleteBooking(booking.id)}
                        disabled={deletingId === booking.id}
                      />
                    </div>
                  </CamvelleInnerPanel>
                )}

                {isOpen && isEditing && (
                  <CamvelleInnerPanel className="mt-6 p-5">
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
                          setEditForm({ ...editForm, preferred_date: value })
                        }
                      />

                      <EditInput
                        label="Status"
                        value={editForm.status}
                        onChange={(value) =>
                          setEditForm({ ...editForm, status: value })
                        }
                      />

                      <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
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
                  </CamvelleInnerPanel>
                )}
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

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <p>
      <span className="text-white/30">{label}:</span>{" "}
      {value || "Not provided"}
    </p>
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
    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
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
