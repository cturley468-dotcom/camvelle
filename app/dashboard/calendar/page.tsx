"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarPlus, Save, UserRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
};

const sections = [
  "overview",
  "clients",
  "bookings",
  "contracts",
  "galleries",
  "finance",
];

export default function CalendarPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("id, full_name, email, phone, notes, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setClients(data || []);
    setLoading(false);
  }

  async function scheduleClient(client: Client, date: string) {
    if (!date) {
      alert("Choose a date first.");
      return;
    }

    setSavingId(client.id);
    setNotice("");

    const { error } = await supabase
      .from("clients")
      .update({
        notes: addScheduledDateToNotes(client.notes, date),
      })
      .eq("id", client.id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedDate(date);
    setNotice("Client scheduled successfully.");
    await loadClients();
  }

  async function removeClientSchedule(client: Client) {
    const confirmRemove = confirm("Remove this client from the schedule?");
    if (!confirmRemove) return;

    setSavingId(client.id);
    setNotice("");

    const { error } = await supabase
      .from("clients")
      .update({
        notes: removeScheduledDateFromNotes(client.notes),
      })
      .eq("id", client.id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Client removed from schedule.");
    await loadClients();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const calendarDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);

      return {
        key: toDateKey(date),
        dayNumber: date.getDate(),
        weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
        month: date.toLocaleDateString(undefined, { month: "short" }),
      };
    });
  }, []);

  const scheduledClients = useMemo(() => {
    return clients.filter((client) => getScheduledDate(client.notes));
  }, [clients]);

  const unscheduledClients = useMemo(() => {
    return clients.filter((client) => !getScheduledDate(client.notes));
  }, [clients]);

  const selectedDateClients = useMemo(() => {
    return scheduledClients.filter(
      (client) => getScheduledDate(client.notes) === selectedDate
    );
  }, [scheduledClients, selectedDate]);

  const clientCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};

    scheduledClients.forEach((client) => {
      const date = getScheduledDate(client.notes);
      if (!date) return;

      counts[date] = (counts[date] || 0) + 1;
    });

    return counts;
  }, [scheduledClients]);

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
              Calendar Management
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Studio
              <br />
              Schedule.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              View upcoming sessions
            </p>

            <div className="mx-auto mt-14 w-full max-w-sm">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                Navigate
              </label>

              <select
                defaultValue="calendar"
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
                <option value="calendar" className="bg-black">
                  Calendar
                </option>

                {sections.map((section) => (
                  <option key={section} value={section} className="bg-black">
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 30 DAY CALENDAR */}
          <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  30 Day Calendar
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Upcoming dates.
                </h2>
              </div>

              <div className="rounded-full border border-white/10 bg-black/40 px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-white/45">
                {scheduledClients.length} scheduled
              </div>
            </div>

            {notice && (
              <div className="mt-8 rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
                {notice}
              </div>
            )}

            <div className="mt-8 rounded-[2.25rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10">
                {calendarDays.map((day) => {
                  const isSelected = selectedDate === day.key;
                  const count = clientCountByDate[day.key] || 0;

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedDate(day.key)}
                      className={`min-h-[82px] rounded-[1.5rem] border p-3 text-left transition ${
                        isSelected
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-black/35 text-white/65 hover:border-white/25 hover:bg-white/[0.08]"
                      }`}
                    >
                      <p
                        className={`text-[9px] uppercase tracking-[0.22em] ${
                          isSelected ? "text-black/50" : "text-white/35"
                        }`}
                      >
                        {day.weekday}
                      </p>

                      <p className="mt-2 text-2xl font-light leading-none">
                        {day.dayNumber}
                      </p>

                      <p
                        className={`mt-1 text-[9px] uppercase tracking-[0.2em] ${
                          isSelected ? "text-black/50" : "text-white/30"
                        }`}
                      >
                        {day.month}
                      </p>

                      {count > 0 && (
                        <span
                          className={`mt-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] ${
                            isSelected
                              ? "bg-black text-white"
                              : "bg-white text-black"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 rounded-[2rem] border border-white/10 bg-black/35 p-5">
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Selected Date
                </p>

                <h3 className="mt-3 text-3xl font-light tracking-[-0.05em]">
                  {formatDate(selectedDate)}
                </h3>

                <div className="mt-5 grid gap-3">
                  {selectedDateClients.length === 0 && (
                    <p className="text-sm leading-7 text-white/45">
                      No clients scheduled for this date.
                    </p>
                  )}

                  {selectedDateClients.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/60">
                          <UserRound size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xl font-light tracking-[-0.04em]">
                            {client.full_name || "Unnamed Client"}
                          </p>

                          <p className="mt-1 break-words text-sm text-white/45">
                            {client.email || "No email"}
                          </p>

                          <p className="text-sm text-white/45">
                            {client.phone || "No phone"}
                          </p>
                        </div>

                        <IconButton
                          label="Remove Schedule"
                          icon={<X size={15} />}
                          onClick={() => removeClientSchedule(client)}
                          disabled={savingId === client.id}
                          danger
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* UNSCHEDULED CLIENTS */}
          <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                Unscheduled Clients
              </p>

              <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                Add to calendar.
              </h2>
            </div>

            {loading && (
              <p className="mt-10 text-white/50">Loading clients...</p>
            )}

            {!loading && unscheduledClients.length === 0 && (
              <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-black/55 p-7 text-white/50">
                All clients have a scheduled date.
              </div>
            )}

            <div className="mt-10 grid gap-4">
              {unscheduledClients.map((client, index) => {
                const draftDate = scheduleDrafts[client.id] || selectedDate;

                return (
                  <div
                    key={client.id}
                    className="mx-auto w-full max-w-3xl rounded-[2.25rem] border border-white/10 bg-white/[0.035] p-5 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-6"
                  >
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                      {String(index + 1).padStart(2, "0")} / Client
                    </p>

                    <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] md:text-4xl">
                      {client.full_name || "Unnamed Client"}
                    </h3>

                    <div className="mt-3 grid gap-1 text-sm leading-6 text-white/50">
                      <p>{client.email || "No email"}</p>
                      <p>{client.phone || "No phone"}</p>
                    </div>

                    <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
                      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                        Schedule Date
                      </label>

                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          type="date"
                          value={draftDate}
                          onChange={(e) =>
                            setScheduleDrafts({
                              ...scheduleDrafts,
                              [client.id]: e.target.value,
                            })
                          }
                          className="w-full rounded-full border border-white/10 bg-black/35 px-5 py-4 text-white outline-none"
                        />

                        <IconButton
                          label={
                            savingId === client.id ? "Saving" : "Schedule Client"
                          }
                          icon={
                            savingId === client.id ? (
                              <Save size={16} />
                            ) : (
                              <CalendarPlus size={16} />
                            )
                          }
                          onClick={() => scheduleClient(client, draftDate)}
                          disabled={savingId === client.id}
                        />
                      </div>

                      <p className="mt-4 text-sm leading-7 text-white/45">
                        This will move the client into the selected calendar
                        date.
                      </p>
                    </div>
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

function getScheduledDate(notes: string | null) {
  if (!notes) return null;

  const match = notes.match(/^Scheduled Date:\s*(\d{4}-\d{2}-\d{2})/im);
  return match?.[1] || null;
}

function removeScheduledDateFromNotes(notes: string | null) {
  const cleaned = (notes || "")
    .replace(/^Scheduled Date:\s*\d{4}-\d{2}-\d{2}\s*\n*/im, "")
    .trim();

  return cleaned || null;
}

function addScheduledDateToNotes(notes: string | null, date: string) {
  const cleaned = removeScheduledDateFromNotes(notes);

  return [`Scheduled Date: ${date}`, cleaned].filter(Boolean).join("\n\n");
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
