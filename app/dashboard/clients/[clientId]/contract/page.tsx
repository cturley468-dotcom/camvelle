"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileSignature, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
};

export default function CreateClientContractPage() {
  const params = useParams();
  const router = useRouter();

  const clientId = Array.isArray(params.clientId)
    ? params.clientId[0]
    : params.clientId;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    contract_type: "Photography Agreement",
    status: "draft",
    sent_date: "",
    signed_date: "",
    notes: "",
  });

  useEffect(() => {
    if (clientId) loadClient();
  }, [clientId]);

  async function loadClient() {
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("id, full_name, email, phone, notes, created_at")
      .eq("id", clientId)
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setClient(data);
    setLoading(false);
  }

  async function createContract() {
    if (!client) {
      alert("Client not found.");
      return;
    }

    setCreating(true);
    setNotice("");

    const { error } = await supabase.from("contracts").insert({
      client_id: client.id,
      client_name: client.full_name,
      client_email: client.email,
      contract_type: form.contract_type || "Photography Agreement",
      status: form.status || "draft",
      sent_date: form.sent_date || null,
      signed_date: form.signed_date || null,
      notes: form.notes || null,
    });

    setCreating(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Contract created successfully.");
    router.push(`/dashboard/clients/${client.id}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const previewStatus = useMemo(() => {
    return form.status || "draft";
  }, [form.status]);

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
            alt="Camvelle Creative"
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
              Client Contract
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Create
              <br />
              agreement file.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              Create a contract record directly inside this client file. Once
              saved, it will appear on the client profile.
            </p>

            <div className="mx-auto mt-12 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/dashboard/clients/${clientId}`}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
              >
                <ArrowLeft size={15} />
                Client File
              </Link>

              <Link
                href="/dashboard/clients"
                className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
              >
                All Clients
              </Link>
            </div>
          </div>

          {notice && (
            <div className="mx-auto mt-6 w-full max-w-3xl rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
              {notice}
            </div>
          )}

          {loading && (
            <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-white/50">
              Loading client...
            </div>
          )}

          {!loading && !client && (
            <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-white/50">
              Client not found.
            </div>
          )}

          {client && (
            <>
              {/* CLIENT PREVIEW */}
              <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Agreement For
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  {client.full_name || "Unnamed Client"}
                </h2>

                <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)] md:p-7">
                  <div className="grid gap-4 text-sm leading-7 text-white/55">
                    <p>
                      <span className="text-white/30">Email:</span>{" "}
                      {client.email || "Not provided"}
                    </p>

                    <p>
                      <span className="text-white/30">Phone:</span>{" "}
                      {client.phone || "Not provided"}
                    </p>

                    <p>
                      <span className="text-white/30">Contract Type:</span>{" "}
                      {form.contract_type || "Photography Agreement"}
                    </p>

                    <p>
                      <span className="text-white/30">Status:</span>{" "}
                      {previewStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* CREATE FORM */}
              <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  New Contract
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Contract details.
                </h2>

                <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)] md:p-7">
                  <div className="grid gap-4">
                    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
                      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                        Contract Type
                      </label>

                      <select
                        value={form.contract_type}
                        onChange={(e) =>
                          setForm({ ...form, contract_type: e.target.value })
                        }
                        className="w-full bg-transparent text-white outline-none"
                      >
                        <option value="Photography Agreement" className="bg-black">
                          Photography Agreement
                        </option>

                        <option value="Proposal Agreement" className="bg-black">
                          Proposal Agreement
                        </option>

                        <option value="Portrait Agreement" className="bg-black">
                          Portrait Agreement
                        </option>

                        <option value="Family Agreement" className="bg-black">
                          Family Agreement
                        </option>

                        <option value="Couples Agreement" className="bg-black">
                          Couples Agreement
                        </option>

                        <option value="Business Agreement" className="bg-black">
                          Business Agreement
                        </option>

                        <option value="Real Estate Agreement" className="bg-black">
                          Real Estate Agreement
                        </option>

                        <option value="Automotive Agreement" className="bg-black">
                          Automotive Agreement
                        </option>

                        <option value="Event Agreement" className="bg-black">
                          Event Agreement
                        </option>
                      </select>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
                      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                        Status
                      </label>

                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                        className="w-full bg-transparent text-white outline-none"
                      >
                        <option value="draft" className="bg-black">
                          Draft
                        </option>

                        <option value="sent" className="bg-black">
                          Sent
                        </option>

                        <option value="signed" className="bg-black">
                          Signed
                        </option>

                        <option value="archived" className="bg-black">
                          Archived
                        </option>
                      </select>
                    </div>

                    <InputBubble
                      label="Sent Date"
                      type="date"
                      value={form.sent_date}
                      onChange={(value) =>
                        setForm({ ...form, sent_date: value })
                      }
                    />

                    <InputBubble
                      label="Signed Date"
                      type="date"
                      value={form.signed_date}
                      onChange={(value) =>
                        setForm({ ...form, signed_date: value })
                      }
                    />

                    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
                      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                        Notes
                      </label>

                      <textarea
                        rows={6}
                        value={form.notes}
                        onChange={(e) =>
                          setForm({ ...form, notes: e.target.value })
                        }
                        placeholder="Agreement details, client notes, usage rights, payment terms, delivery notes..."
                        className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={createContract}
                        disabled={creating}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/65 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                        title="Create Contract"
                      >
                        {creating ? <Save size={16} /> : <FileSignature size={16} />}
                      </button>

                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/65 transition hover:bg-white hover:text-black"
                        title="Cancel"
                      >
                        <X size={16} />
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={createContract}
                      disabled={creating}
                      className="mt-4 rounded-full bg-[#f5f0e7] px-7 py-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {creating ? "Creating Contract..." : "Create Contract"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function InputBubble({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
      />
    </div>
  );
}
