"use client";

import Link from "next/link";

const sections = [
  { label: "Dashboard", value: "" },
  { label: "Clients", value: "clients" },
  { label: "Bookings", value: "bookings" },
  { label: "Calendar", value: "calendar" },
  { label: "Galleries", value: "galleries" },
  { label: "Finance", value: "finance" },
];

export default function DashboardHero({
  eyebrow,
  title,
  description,
  currentPage,
  primaryHref = "/dashboard/clients",
  primaryLabel = "Clients",
}: {
  eyebrow: string;
  title: string;
  description: string;
  currentPage: string;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.015] p-8 text-center shadow-[inset_0_0_60px_rgba(255,255,255,0.02)] backdrop-blur-[1px] md:p-14">
      <p className="text-[11px] uppercase tracking-[0.6em] text-white/35">
        {eyebrow}
      </p>

      <h1 className="mx-auto mt-8 max-w-5xl text-6xl font-light leading-[0.88] tracking-[-0.09em] md:text-8xl">
        {title.split("\n").map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </h1>

      <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/45">
        {description}
      </p>

      <div className="mx-auto mt-12 max-w-3xl">
        <label className="mb-3 block text-left text-[11px] uppercase tracking-[0.35em] text-white/35">
          Navigate
        </label>

        <select
          value={currentPage}
          onChange={(e) => {
            const value = e.target.value;
            window.location.href = value ? `/dashboard/${value}` : "/dashboard";
          }}
          className="w-full rounded-full border border-white/10 bg-black/45 px-6 py-5 text-[11px] uppercase tracking-[0.32em] text-white outline-none backdrop-blur-xl transition hover:border-white/20"
        >
          {sections.map((section) => (
            <option
              key={section.value || "dashboard"}
              value={section.value}
              className="bg-black"
            >
              {section.label}
            </option>
          ))}
        </select>

        <div className="mt-5">
          <Link
            href={primaryHref}
            className="block rounded-full border border-white/10 bg-black/45 px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
