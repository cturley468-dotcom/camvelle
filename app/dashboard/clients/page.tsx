"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleInnerPanel,
  CamvellePageShell,
  CamvellePanel,
  camvelleCreamButton,
  camvelleGhostButton,
} from "../../components/CamvelleUI";

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
};

const sections = ["overview", "bookings", "calendar","contracts", "invoices", "galleries", "finance", "expenses", ];


export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

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

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase();

    return clients.filter((client) => {
      return (
        client.full_name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.notes?.toLowerCase().includes(term)
      );
    });
  }, [clients, search]);

  return (
    <CamvellePageShell>
      <header className="relative z-[9999] mb-10 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/branding/camvelle-logo.png"
            alt="Camvelle Creative"
            width={420}
            height={120}
            priority
            unoptimized
            className="h-14 w-auto object-contain sm:h-16 md:h-20"
          />
        </Link>

        <button type="button" onClick={handleLogout} className={camvelleCreamButton}>
          Logout
        </button>
      </header>

      <CamvellePanel className="p-8 text-center sm:p-10 md:p-14">
        <CamvelleEyebrow>Client Management</CamvelleEyebrow>

        <CamvelleHeading>
          Clients
          <br />
          HQ
        </CamvelleHeading>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
          Manage your Camvelle Creative client records, session history,
          contracts, invoices, and photo delivery progress.
        </p>

        <div className="mx-auto mt-12 w-full max-w-sm">
          <label className="mb-3 block text-left text-[11px] uppercase tracking-[0.35em] text-white/35">
            Navigate
          </label>

          <select
            defaultValue="clients"
            onChange={(e) => {
              if (e.target.value === "overview") {
                window.location.href = "/dashboard";
                return;
              }

              if (e.target.value) {
                window.location.href = `/dashboard/${e.target.value}`;
              }
            }}
            className="w-full rounded-full border border-white/10 bg-black/45 px-6 py-5 text-[11px] uppercase tracking-[0.32em] text-white outline-none backdrop-blur-xl transition hover:border-white/20"
          >
            <option value="clients" className="bg-black">
              Clients
            </option>

            {sections.map((section) => (
              <option key={section} value={section} className="bg-black">
                {section}
              </option>
            ))}
          </select>
        </div>
      </CamvellePanel>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <StatCard title="Total Clients" value={String(clients.length)} />
        <StatCard title="Visible Results" value={String(filteredClients.length)} />
      </div>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Client Cards</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] text-white md:text-6xl">
              Session records.
            </h2>
          </div>

          <CamvelleInnerPanel className="w-full max-w-md px-6 py-4">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setNotice("");
              }}
              placeholder="Search clients..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </CamvelleInnerPanel>
        </div>

        {notice && (
          <div className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-5 text-center text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {loading && <p className="mt-10 text-white/50">Loading clients...</p>}

        {!loading && filteredClients.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
            No clients found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-4">
          {filteredClients.map((client, index) => (
            <CamvelleInnerPanel
              key={client.id}
              className="mx-auto w-full max-w-3xl p-5 transition duration-500 hover:border-white/20 hover:bg-white/[0.04] md:p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                    {String(index + 1).padStart(2, "0")} / Client
                  </p>

                  <h3 className="mt-3 truncate text-3xl font-light tracking-[-0.06em] text-white md:text-4xl">
                    {client.full_name || "Unnamed Client"}
                  </h3>

                  <div className="mt-3 grid gap-1 text-sm leading-6 text-white/50">
                    <p className="truncate">{client.email || "No email"}</p>
                    <p>{client.phone || "No phone"}</p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className={camvelleGhostButton}
                >
                  Open
                </Link>
              </div>
            </CamvelleInnerPanel>
          ))}
        </div>
      </CamvellePanel>
    </CamvellePageShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <CamvelleInnerPanel className="p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.04]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em] text-white">
        {value}
      </h3>
    </CamvelleInnerPanel>
  );
}
