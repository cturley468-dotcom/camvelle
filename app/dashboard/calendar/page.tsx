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
  "bookings",
  "invoices",
  "contracts",
  "galleries",
  "finance",
];

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const scheduledBookings = useMemo(() => {
    return bookings.filter((booking) => booking.preferred_date);
  }, [bookings]);

  const next30Days = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setDate(today.getDate() + index);
      return date;
    });
  }, []);

  async function loadBookings() {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("preferred_date", { ascending: true });

    if (!error) {
      setBookings(data || []);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function bookingsForDay(day: Date) {
    const target = dateKey(day);

    return scheduledBookings.filter((booking) => {
      if (!booking.preferred_date) return false;

      const bookingDate = new Date(booking.preferred_date);
      return dateKey(bookingDate) === target;
    });
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

      <section className="relative z-10 px-2 pb-24 pt-6 md:px-10">
        <div className="mx-auto max-w-7xl">
          {/* HERO */}
          <div className="w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-center transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-14">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Calendar Management
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Studio
              <br />
              schedule.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              View upcoming sessions, preferred dates, availability, and client
              requests in a clean mobile-first calendar flow.
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
                <option value="">Calendar</option>

                {sections.map((section) => (
                  <option key={section} value={section} className="bg-black">
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Preferred Dates"
              value={loading ? "..." : String(scheduledBookings.length)}
            />
            <StatCard title="Confirmed Sessions" value="0" />
            <StatCard title="Open Days" value="30" />
            <StatCard title="This Week" value={String(countThisWeek(scheduledBookings))} />
          </div>

          {/* 30 DAY CALENDAR */}
          <div className="mt-6 rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Next 30 Days
            </p>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
              Mobile calendar.
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {next30Days.map((day) => {
                const dayBookings = bookingsForDay(day);
                const isToday = dateKey(day) === dateKey(new Date());

                return (
                  <div
                    key={dateKey(day)}
                    className={`rounded-[2.5rem] border p-6 transition duration-500 ${
                      isToday
                        ? "border-white/25 bg-white/[0.055]"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                          {day.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </p>

                        <h3 className="mt-3 text-4xl font-light tracking-[-0.06em]">
                          {day.getDate()}
                        </h3>

                        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-white/35">
                          {day.toLocaleDateString("en-US", {
                            month: "long",
                          })}
                        </p>
                      </div>

                      <span className="rounded-full border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.25em] text-white/45">
                        {dayBookings.length === 0
                          ? "Open"
                          : `${dayBookings.length} Request${dayBookings.length === 1 ? "" : "s"}`}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      {dayBookings.length === 0 && (
                        <p className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-white/40">
                          No session requests for this date.
                        </p>
                      )}

                      {dayBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4"
                        >
                          <p className="text-sm font-medium text-white/75">
                            {booking.full_name || "Unnamed Client"}
                          </p>

                          <p className="mt-2 text-sm text-white/45">
                            {booking.service_type || "Session request"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* UPCOMING REQUESTS */}
          <div className="mt-6 rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Schedule Queue
            </p>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
              Preferred dates.
            </h2>

            {loading && (
              <p className="mt-10 text-white/50">Loading schedule requests...</p>
            )}

            {!loading && scheduledBookings.length === 0 && (
              <div className="mt-10 rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-white/50">
                No preferred dates submitted yet.
              </div>
            )}

            <div className="mt-10 grid gap-5">
              {scheduledBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-8"
                >
                  <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.4em] text-white/30">
                        Preferred Session Date
                      </p>

                      <h3 className="mt-5 text-4xl font-light tracking-[-0.06em] md:text-5xl">
                        {booking.full_name || "Unnamed Client"}
                      </h3>

                      <p className="mt-4 text-lg text-white/45">
                        {booking.service_type || "Session type not selected"}
                      </p>

                      <p className="mt-5 text-white/55">
                        {formatDate(booking.preferred_date)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                      <ActionButton label="Confirm Date" />
                      <ActionButton label="Reschedule" />
                      <ActionButton label="Open Client" />
                    </div>
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

function dateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDate(date: string | null) {
  if (!date) return "Date not provided";

  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function countThisWeek(bookings: Booking[]) {
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);

  return bookings.filter((booking) => {
    if (!booking.preferred_date) return false;

    const date = new Date(booking.preferred_date);

    return date >= today && date <= weekFromNow;
  }).length;
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">{value}</h3>
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
