"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Calendar,
  FileSignature,
  Pencil,
  ReceiptText,
  Save,
  Trash2,
  X,
} from "lucide-react";
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
  "bookings",
  "calendar",
  "invoices",
  "contracts",
  "galleries",
  "finance",
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    notes: "",
  });

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

  function startEdit(client: Client) {
    setNotice("");
    setEditingId(client.id);
    setOpenId(client.id);

    setEditForm({
      full_name: client.full_name || "",
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
  }

  async function saveClient(id: string) {
    setSavingId(id);
    setNotice("");

    const { error } = await supabase
      .from("clients")
      .update({
        full_name: editForm.full_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        notes: editForm.notes || null,
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setNotice("Client updated successfully.");
    await loadClients();
  }

  async function deleteClient(id: string) {
    const confirmDelete = confirm("Delete this client?");
    if (!confirmDelete) return;

    setDeletingId(id);
    setNotice("");

    const { error } = await supabase.from("clients").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setOpenId(null);
    setEditingId(null);
    setNotice("Client deleted successfully.");
    await loadClients();
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
              Client Management
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Client
              <br />
              Creative HQ
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              View client records, contact information, notes, and creative
              workflow details.
            </p>

            <div className="mx-auto mt-14 w-full max-w-sm">
              <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
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
                className="w-full rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white outline-none transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
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
          </div>

          <div className="mx-auto mt-6 grid w-full gap-5 md:grid-cols-2">
            <StatCard title="Total Clients" value={String(clients.length)} />
            <StatCard
              title="Visible Results"
              value={String(filteredClients.length)}
            />
          </div>

          <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Client Cards
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Session records.
                </h2>
              </div>

              <div className="w-full max-w-md rounded-full border border-white/10 bg-white/[0.025] px-6 py-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                />
              </div>
            </div>

            {notice && (
              <div className="mt-8 rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
                {notice}
              </div>
            )}

            {loading && <p className="mt-10 text-white/50">Loading clients...</p>}

            {!loading && filteredClients.length === 0 && (
              <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-7 text-white/50">
                No clients found.
              </div>
            )}

            <div className="mt-10 grid gap-4">
              {filteredClients.map((client, index) => {
                const isOpen = openId === client.id;
                const isEditing = editingId === client.id;

                return (
                  <div
                    key={client.id}
                    className="mx-auto w-full max-w-3xl rounded-[2.25rem] border border-white/10 bg-white/[0.035] p-5 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
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
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(isOpen ? null : client.id);
                          setEditingId(null);
                          setNotice("");
                        }}
                        className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:border-white/25 hover:bg-white hover:text-black"
                      >
                        {isOpen ? "Close" : "Open"}
                      </button>
                    </div>

                    {isOpen && !isEditing && (
                      <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
                        <div className="grid gap-4 text-sm leading-7 text-white/55">
                          <p>
                            <span className="text-white/30">Name:</span>{" "}
                            {client.full_name || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Email:</span>{" "}
                            {client.email || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Phone:</span>{" "}
                            {client.phone || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Created:</span>{" "}
                            {client.created_at
                              ? new Date(client.created_at).toLocaleDateString()
                              : "Not provided"}
                          </p>

                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                              Notes
                            </p>

                            <p className="mt-3 whitespace-pre-wrap text-white/55">
                              {client.notes || "No notes saved."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <IconButton
                            label="Edit"
                            icon={<Pencil size={16} />}
                            onClick={() => startEdit(client)}
                          />

                          <IconLink
                            label="Schedule"
                            href="/dashboard/calendar"
                            icon={<Calendar size={16} />}
                          />

                          <IconLink
                            label="Contract"
                            href="/dashboard/contracts"
                            icon={<FileSignature size={16} />}
                          />

                          <IconLink
                            label="Invoice"
                            href="/dashboard/invoices"
                            icon={<ReceiptText size={16} />}
                          />

                          <IconButton
                            label={
                              deletingId === client.id ? "Deleting" : "Delete"
                            }
                            danger
                            icon={<Trash2 size={16} />}
                            onClick={() => deleteClient(client.id)}
                            disabled={deletingId === client.id}
                          />
                        </div>
                      </div>
                    )}

                    {isOpen && isEditing && (
                      <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
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

                          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
                            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                              Notes
                            </label>

                            <textarea
                              rows={5}
                              value={editForm.notes}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  notes: e.target.value,
                                })
                              }
                              className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <IconButton
                            label={savingId === client.id ? "Saving" : "Save"}
                            icon={<Save size={16} />}
                            onClick={() => saveClient(client.id)}
                            disabled={savingId === client.id}
                          />

                          <IconButton
                            label="Cancel"
                            icon={<X size={16} />}
                            onClick={() => setEditingId(null)}
                          />
                        </div>
                      </div>
                    )}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </label>

      <input
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

function IconLink({
  label,
  icon,
  href,
}: {
  label: string;
  icon: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/65 transition hover:bg-white hover:text-black"
    >
      {icon}
    </Link>
  );
}
