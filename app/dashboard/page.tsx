"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: string;
};

const sections = [
  "clients",
  "bookings",
  "calendar",
  "invoices",
  "contracts",
  "galleries",
  "finance",
];

export default function DashboardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInquiries();
  }, []);

  const estimatedRevenue = useMemo(() => {
    return inquiries.length * 400;
  }, [inquiries.length]);

  async function loadInquiries() {
    const { data } = await supabase
      .from("inquiries")
      .select("id");

    setInquiries(data || []);
    setLoading(false);
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
            backgroundImage:
              "url('/backgrounds/camvelle-background.png')",
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

          {/* HERO */}
          <div className="relative z-10 px-5 pb-20 pt-8 md:px-10">
        <div className="w-full max-w-6xl rounded-[3rem] border border-white/10 bg-white/[0.035] p-10 md:p-18 text-center transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-10">
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
                  Your complete photography business overview.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                  Open Section
                </label>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      window.location.href = `/dashboard/${e.target.value}`;
                    }
                  }}
                  className="w-full rounded-full border border-white/10 bg-white/[0.035] backdrop-blur-xl px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white outline-none transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <option value="">Select Page</option>

                  {sections.map((section) => (
                    <option
                      key={section}
                      value={section}
                      className="bg-black"
                    >
                      {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Inquiries"
              value={loading ? "..." : String(inquiries.length)}
            />

            <StatCard
              title="Estimated Revenue"
              value={`$${estimatedRevenue}`}
            />

            <StatCard
              title="Open Invoices"
              value="0"
            />

            <StatCard
              title="Contracts"
              value="0"
            />
          </div>

          {/* OVERVIEW CARDS */}
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <DashboardCard
              href="/dashboard/clients"
              title="Clients"
              value={String(inquiries.length)}
              description="Manage client records and profiles."
            />

            <DashboardCard
              href="/dashboard/bookings"
              title="Bookings"
              value={String(inquiries.length)}
              description="Review incoming inquiries and sessions."
            />

            <DashboardCard
              href="/dashboard/calendar"
              title="Calendar"
              value="30 Days"
              description="Upcoming sessions and availability."
            />

            <DashboardCard
              href="/dashboard/invoices"
              title="Invoices"
              value="$0"
              description="Billing and payment tracking."
            />

            <DashboardCard
              href="/dashboard/contracts"
              title="Contracts"
              value="0"
              description="Signed agreements and documents."
            />

            <DashboardCard
              href="/dashboard/galleries"
              title="Galleries"
              value="Manage"
              description="Upload and organize gallery content."
            />

            <DashboardCard
              href="/dashboard/finance"
              title="Finance"
              value={`$${estimatedRevenue}`}
              description="Monthly and yearly reporting."
            />
          </div>

          {/* CALENDAR */}
          <div className="mt-6 rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl shadow-[0_0_90px_rgba(255,255,255,.08)] md:p-12">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Calendar
            </p>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
              Next 30 days.
            </h2>

            <MiniCalendar />
          </div>

        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl shadow-[0_0_90px_rgba(255,255,255,.08)] transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">
        {value}
      </h3>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  value,
  description,
}: {
  href: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl shadow-[0_0_90px_rgba(255,255,255,.08)] transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
    >
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">
        {value}
      </h3>

      <p className="mt-5 leading-7 text-white/50">
        {description}
      </p>
    </Link>
  );
}

function MiniCalendar() {
  const today = new Date();

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() + i);
    return date;
  });

  return (
    <div className="mt-10 grid grid-cols-5 gap-3 md:grid-cols-10">
      {days.map((day, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center backdrop-blur-xl"
        >
          <p className="text-xs text-white/40">
            {day.toLocaleDateString("en-US", {
              month: "short",
            })}
          </p>

          <p className="mt-2 text-lg font-light">
            {day.getDate()}
          </p>
        </div>
      ))}
    </div>
  );
}
