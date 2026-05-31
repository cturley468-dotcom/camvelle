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

  async function createClientFromBooking(booking: Booking) {
    setCreatingId(booking.id);

    const { error } = await supabase.from("clients").insert({
      full_name: booking.full_name,
      email: booking.email,
      phone: booking.phone,
      service_type: booking.service_type,
      preferred_date: booking.preferred_date,
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
      {/* BACKGROUND */}
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

      {/* HEADER */}
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
          {/* HERO */}
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
              Review inquiries, client details, requested services, preferred
              dates, and next steps before moving them into the client workflow.
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

          {/* STATS */}
          <div className="mx-auto mt-6 grid w-full gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="New Requests" value={loading ? "..." : String(newBookings)} />
            <StatCard title="Needs Reply" value={String(newBookings)} />
            <StatCard title="Scheduled" value="0" />
            <StatCard title="Converted Clients" value="0" />
          </div>

          {/* BOOKING LIST */}
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
                  className="mx-auto w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-8"
                >
                  <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.4em] text-white/30">
                        {String(index + 1).padStart(2, "0")} / Request
                      </p>

                      <h3 className="mt-5 text-4xl font-light tracking-[-0.06em] md:text-5xl">
                        {booking.full_name || "Unnamed Inquiry"}
                      </h3>

                      <p className="mt-4 text-lg text-white/45">
                        {booking.service_type || "Session type not selected"}
                      </p>

                      <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <InfoCard label="Email" value={booking.email} />
                        <InfoCard label="Phone" value={booking.phone} />
                        <InfoCard label="Preferred Date" value={booking.preferred_date} />
                        <InfoCard label="Status" value={booking.status || "New Inquiry"} />
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <WorkflowStatus
                        title="Reply"
                        status="Needed"
                        detail="Send client follow-up or confirmation."
                      />

                      <WorkflowStatus
                        title="Client Card"
                        status="Pending"
                        detail="Convert inquiry into a client profile."
                      />

                      <WorkflowStatus
                        title="Contract"
                        status="Not Sent"
                        detail="Agreement will be created after approval."
                      />

                      <WorkflowStatus
                        title="Invoice"
                        status="Not Created"
                        detail="Deposit and balance tracking pending."
                      />
                    </div>
                  </div>

                  {booking.message && (
                    <div className="mt-7 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
                        Inquiry Message
                      </p>

                      <p className="mt-4 whitespace-pre-wrap leading-8 text-white/55">
                        {booking.message}
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <ActionButton label="View Request" />

                    <ActionButton label="Reply" />

                    <button
                      type="button"
                      onClick={() => createClientFromBooking(booking)}
                      disabled={creatingId === booking.id}
                      className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:border-white/25 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creatingId === booking.id ? "Creating..." : "Create Client"}
                    </button>

                    <ActionButton label="Schedule Session" />
                  </div>
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

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">
        {value}
      </h3>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
      <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </p>

      <p className="mt-3 break-words text-white/65">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function WorkflowStatus({
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

      <p className="mt-4 text-sm text-white/55">
        {detail}
      </p>
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:border-white/25 hover:bg-white hover:text-black"
    >
      {label}
    </button>
  );
}
