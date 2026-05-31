"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  "invoices",
  "contracts",
  "galleries",
  "finance",
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const newBookings = useMemo(() => bookings.length, [bookings]);

  async function loadBookings() {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setBookings(data || []);
    setLoading(false);
  }

  function startEdit(booking: Booking) {
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

  async function saveBookingEdit(id: string) {
    const { error } = await supabase
      .from("inquiries")
      .update({
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        service_type: editForm.service_type,
        preferred_date: editForm.preferred_date || null,
        message: editForm.message,
        status: editForm.status,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    await loadBookings();
  }

  async function deleteBooking(id: string) {
    const confirmDelete = confirm("Delete this booking request?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("inquiries").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadBookings();
  }

  async function createClientFromBooking(booking: Booking) {
    setCreatingId(booking.id);

    const { error } = await supabase.from("clients").insert({
      full_name: booking.full_name,
      email: booking.email,
      phone: booking.phone,
      service_type: booking.service_type,
      notes: booking.message,
      status: "active",
    });

    setCreatingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Client created.");
    window.location.href = "/dashboard/clients";
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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

      <section className="relative z-10 px-4 pb-24 pt-6 md:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-center transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-14">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Booking Management
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Incoming
              <br />
              session requests.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              Review inquiries, edit details, delete old requests, and convert
              approved bookings into client records.
            </p>

            <div className="mx-auto mt-14 w-full max-w-sm">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                Navigate
              </label>

              <select
                defaultValue=""
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
                <option value="">Bookings</option>

                {sections.map((section) => (
                  <option key={section} value={section} className="bg-black">
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mx-auto mt-6 grid w-full gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="New Requests" value={loading ? "..." : String(newBookings)} />
            <StatCard title="Needs Reply" value={String(newBookings)} />
            <StatCard title="Scheduled" value="0" />
            <StatCard title="Converted Clients" value="0" />
          </div>

          <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Booking Requests
            </p>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
              Inquiry queue.
            </h2>

            {loading && (
              <p className="mt-10 text-white/50">Loading booking requests...</p>
            )}

            {!loading && bookings.length === 0 && (
              <div className="mt-10 rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-white/50">
                No booking requests yet.
              </div>
            )}

            <div className="mt-10 grid gap-5">
              {bookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-7"
                >
                  {editingId === booking.id ? (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.4em] text-white/30">
                        Edit Request
                      </p>

                      <div className="mt-6 grid gap-4">
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
                          label="Service Type"
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

                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
                          <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                            Message
                          </label>

                          <textarea
                            value={editForm.message}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                message: e.target.value,
                              })
                            }
                            rows={5}
                            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => saveBookingEdit(booking.id)}
                          className="rounded-full bg-[#f5f0e7] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-white"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] uppercase tracking-[0.4em] text-white/30">
                        {String(index + 1).padStart(2, "0")} / Request
                      </p>

                      <h3 className="mt-5 text-4xl font-light tracking-[-0.06em] md:text-5xl">
                        {booking.full_name || "Unnamed Inquiry"}
                      </h3>

                      <p className="mt-4 text-lg text-white/45">
                        {booking.service_type || "Session type not selected"}
                      </p>

                      <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
                        <div className="grid gap-3 text-sm leading-6 text-white/55">
                          <p>
                            <span className="text-white/30">Email:</span>{" "}
                            {booking.email || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Phone:</span>{" "}
                            {booking.phone || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Date:</span>{" "}
                            {booking.preferred_date || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Status:</span>{" "}
                            {booking.status || "New Inquiry"}
                          </p>
                        </div>
                      </div>

                      {booking.message && (
                        <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
                          <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                            Details
                          </p>

                          <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-white/50">
                            {booking.message}
                          </p>
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => createClientFromBooking(booking)}
                          disabled={creatingId === booking.id}
                          className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:border-white/25 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creatingId === booking.id
                            ? "Creating..."
                            : "Create Client"}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(booking)}
                          className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:border-white/25 hover:bg-white hover:text-black"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteBooking(booking.id)}
                          className="rounded-full border border-red-400/20 bg-red-500/10 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
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

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">{value}</h3>
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
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
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
