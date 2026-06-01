"use client";

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

const viewModes = ["Day", "Week", "Month"];

export default function CalendarPage() {
  const [activeView, setActiveView] = useState("Week");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("preferred_date", { ascending: true });

    if (!error && data) setInquiries(data);
    setLoading(false);
  }

  const datedInquiries = useMemo(
    () => inquiries.filter((item) => item.preferred_date),
    [inquiries]
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
      <div className="pointer-events-none fixed inset-0">
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

      <header className="relative z-[9999] flex items-center justify-between px-5 py-6 md:px-10">
        <Link href="/" className="flex items-center">
          <img
            src="/branding/camvelle-logo.png"
            alt="Camvelle Creative"
            className="h-12 w-auto object-contain md:h-16 lg:h-20 xl:h-24"
          />
        </Link>

        <Link
          href="/dashboard"
          className="rounded-full border border-white/10 bg-[#f5f0e7] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02]"
        >
          Dashboard
        </Link>
      </header>

      <section className="relative z-10 px-5 pb-24 pt-4 md:px-10">
        <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
          Studio Calendar
        </p>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h1 className="max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl lg:text-[7rem]">
            Sessions by
            <br />
            day, week, month.
          </h1>

          <div className="flex rounded-full border border-white/10 bg-white/[0.035] p-2 backdrop-blur-xl">
            {viewModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveView(mode)}
                className={`rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] transition ${
                  activeView === mode
                    ? "bg-[#f5f0e7] text-black"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
              Mobile Overview
            </p>

            <div className="mt-8 grid gap-4">
              <OverviewCard title="Total Requests" value={inquiries.length} />
              <OverviewCard title="Dated Requests" value={datedInquiries.length} />
              <OverviewCard title="Current View" value={activeView} />
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/20 p-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
                Next Up
              </p>

              {datedInquiries[0] ? (
                <div className="mt-5">
                  <p className="text-2xl font-light tracking-[-0.04em]">
                    {datedInquiries[0].full_name}
                  </p>
                  <p className="mt-2 text-white/45">
                    {datedInquiries[0].service_type || "Session"} ·{" "}
                    {datedInquiries[0].preferred_date}
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-white/45">No dated sessions yet.</p>
              )}
            </div>
          </aside>

          <section className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-8">
            {activeView === "Day" && (
              <CalendarColumn
                title="Day View"
                subtitle="Scrollable daily session timeline."
                items={datedInquiries}
                loading={loading}
                compact
              />
            )}

            {activeView === "Week" && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
                  Week View
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-7">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, index) => (
                      <div
                        key={day}
                        className="min-h-[280px] rounded-[2rem] border border-white/10 bg-black/20 p-5"
                      >
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">
                          {day}
                        </p>

                        <p className="mt-4 text-4xl font-light">
                          {index + 1}
                        </p>

                        <div className="mt-6 space-y-3">
                          {datedInquiries
                            .filter((_, i) => i % 7 === index)
                            .slice(0, 2)
                            .map((item) => (
                              <SessionPill key={item.id} item={item} />
                            ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activeView === "Month" && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
                  Month View
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
                  {Array.from({ length: 35 }).map((_, index) => (
                    <div
                      key={index}
                      className="min-h-[150px] rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                    >
                      <p className="text-xl font-light">{index + 1}</p>

                      {datedInquiries[index % Math.max(datedInquiries.length, 1)] &&
                        index < datedInquiries.length && (
                          <div className="mt-4 rounded-xl bg-white/[0.06] p-3 text-xs text-white/55">
                            {
                              datedInquiries[
                                index % Math.max(datedInquiries.length, 1)
                              ].service_type
                            }
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function OverviewCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>
      <p className="mt-5 text-4xl font-light tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function CalendarColumn({
  title,
  subtitle,
  items,
  loading,
  compact,
}: {
  title: string;
  subtitle: string;
  items: Inquiry[];
  loading: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
        {title}
      </p>

      <p className="mt-4 max-w-xl text-white/45">{subtitle}</p>

      <div className="mt-8 max-h-[680px] space-y-4 overflow-y-auto pr-2">
        {loading && <p className="text-white/45">Loading sessions...</p>}

        {!loading && items.length === 0 && (
          <p className="text-white/45">No dated sessions yet.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-[2rem] border border-white/10 bg-black/20 p-6 ${
              compact ? "" : "min-h-[160px]"
            }`}
          >
            <p className="text-2xl font-light tracking-[-0.04em]">
              {item.full_name || "Unnamed Session"}
            </p>
            <p className="mt-2 text-white/45">
              {item.service_type || "Session"} · {item.preferred_date}
            </p>
            <p className="mt-4 text-sm leading-7 text-white/40">
              {item.message || "No details provided."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionPill({ item }: { item: Inquiry }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm text-white/75">{item.full_name}</p>
      <p className="mt-1 text-xs text-white/35">{item.service_type}</p>
    </div>
  );
}
