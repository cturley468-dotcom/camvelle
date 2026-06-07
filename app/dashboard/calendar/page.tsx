"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarPlus, Save, UserRound, X } from "lucide-react";
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

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
};

const sections = ["overview", "clients", "bookings", "galleries", "contracts", "invoices", "finance", "expenses", ];


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
        <CamvelleEyebrow>Calendar Management</CamvelleEyebrow>

        <CamvelleHeading>
          Studio
          <br />
          Schedule.
        </CamvelleHeading>

        <CamvelleBody>View upcoming sessions.</CamvelleBody>

        <div className="mx-auto mt-12 w-full max-w-xl text-left">
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
            className="w-full rounded-full border border-white/10 bg-black/20 px-7 py-5 text-[11px] font-bold uppercase tracking-[0.35em] text-white outline-none transition hover:border-white/20 hover:bg-black/30"
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
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>30 Day Calendar</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Upcoming
              <br />
              dates.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
              Click a date to view scheduled clients. Add unscheduled clients
              below.
            </p>
          </div>

          <CamvelleStatusPill status={`${scheduledClients.length} Scheduled`} />
        </div>

        {notice && (
          <div className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
            {notice}
          </div>
        )}

        <CamvelleInnerPanel className="mt-8 p-5 sm:p-6">
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
                      ? "border-white bg-[#f5f0e7] text-black"
                      : "border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:bg-black/30"
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
                        isSelected ? "bg-black text-white" : "bg-[#f5f0e7] text-black"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <CamvelleInnerPanel className="mt-7 p-5">
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
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/60">
                      <UserRound size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="text-xl font-light tracking-[-0.04em] text-white transition hover:text-white/70"
                      >
                        {client.full_name || "Unnamed Client"}
                      </Link>

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
          </CamvelleInnerPanel>
        </CamvelleInnerPanel>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <CamvelleEyebrow>Unscheduled Clients</CamvelleEyebrow>

        <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
          Add to
          <br />
          calendar.
        </h2>

        {loading && <p className="mt-10 text-white/50">Loading clients...</p>}

        {!loading && unscheduledClients.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
            All clients have a scheduled date.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-4">
          {unscheduledClients.map((client, index) => {
            const draftDate = scheduleDrafts[client.id] || selectedDate;

            return (
              <CamvelleInnerPanel
                key={client.id}
                className="mx-auto w-full max-w-3xl p-5 transition hover:border-white/20 md:p-6"
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                  {String(index + 1).padStart(2, "0")} / Client
                </p>

                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="mt-3 block text-3xl font-light tracking-[-0.06em] text-white transition hover:text-white/70 md:text-4xl"
                >
                  {client.full_name || "Unnamed Client"}
                </Link>

                <div className="mt-3 grid gap-1 text-sm leading-6 text-white/50">
                  <p>{client.email || "No email"}</p>
                  <p>{client.phone || "No phone"}</p>
                </div>

                <CamvelleInnerPanel className="mt-6 p-5">
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
                      className="w-full rounded-full border border-white/10 bg-black/20 px-5 py-4 text-white outline-none transition hover:border-white/20"
                    />

                    <IconButton
                      label={savingId === client.id ? "Saving" : "Schedule Client"}
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
                    This will move the client into the selected calendar date.
                  </p>
                </CamvelleInnerPanel>
              </CamvelleInnerPanel>
            );
          })}
        </div>
      </CamvellePanel>
    </CamvellePageShell>
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
