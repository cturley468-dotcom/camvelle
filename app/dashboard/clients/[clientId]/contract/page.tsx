"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileSignature, X } from "lucide-react";
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

const contractTypes = [
  "Photography Agreement",
  "Proposal Agreement",
  "Portrait Agreement",
  "Family Agreement",
  "Couples Agreement",
  "Business Agreement",
  "Real Estate Agreement",
  "Automotive Agreement",
  "Event Agreement",
];

const statusOptions = ["draft", "sent", "signed", "archived"];

export default function CreateClientContractPage() {
  const params = useParams();
  const router = useRouter();

  const rawClientId = Array.isArray(params.clientId)
    ? params.clientId[0]
    : params.clientId;

  const clientId = typeof rawClientId === "string" ? rawClientId : "";

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
    if (clientId) {
      loadClient();
    }
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

    const contractTitle = `${client.full_name || "Client"} - ${
      form.contract_type || "Photography Agreement"
    }`;

    const { error } = await supabase.from("contracts").insert({
      client_id: client.id,
      client_name: client.full_name,
      client_email: client.email,
      title: contractTitle,
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
        <CamvelleEyebrow>Client Contract</CamvelleEyebrow>

        <CamvelleHeading>
          Create
          <br />
          agreement file.
        </CamvelleHeading>

        <CamvelleBody>
          Create a contract record directly inside this client file. Once saved,
          it will appear on the client profile.
        </CamvelleBody>

        <div className="mx-auto mt-12 grid w-full max-w-xl gap-3 sm:grid-cols-2">
          <Link
            href={`/dashboard/clients/${clientId}`}
            className={camvelleGhostButton}
          >
            <ArrowLeft size={15} />
            Client File
          </Link>

          <Link href="/dashboard/clients" className={camvelleGhostButton}>
            All Clients
          </Link>
        </div>
      </CamvellePanel>

      {notice && (
        <div className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
          {notice}
        </div>
      )}

      {loading && (
        <CamvellePanel className="mt-6 p-7 text-white/50 md:p-12">
          Loading client...
        </CamvellePanel>
      )}

      {!loading && !client && (
        <CamvellePanel className="mt-6 p-7 text-white/50 md:p-12">
          Client not found.
        </CamvellePanel>
      )}

      {client && (
        <>
          <CamvellePanel className="mt-6 p-7 md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <CamvelleEyebrow>Agreement For</CamvelleEyebrow>

                <h2 className="mt-6 break-words text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white md:text-6xl">
                  {client.full_name || "Unnamed Client"}
                </h2>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
                  Review the client details before creating this agreement.
                </p>
              </div>

              <CamvelleStatusPill status={previewStatus} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <InfoCard label="Email" value={client.email || "Not provided"} />
              <InfoCard label="Phone" value={client.phone || "Not provided"} />
              <InfoCard
                label="Contract Type"
                value={form.contract_type || "Photography Agreement"}
              />
              <InfoCard label="Status" value={previewStatus} />
            </div>
          </CamvellePanel>

          <CamvellePanel className="mt-6 p-7 md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <CamvelleEyebrow>New Contract</CamvelleEyebrow>

                <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white md:text-6xl">
                  Contract
                  <br />
                  details.
                </h2>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
                  Choose the agreement type, status, dates, and any notes that
                  should appear on this contract record.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
                <FileSignature size={18} />
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <CamvelleInnerPanel className="p-5">
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
                  {contractTypes.map((type) => (
                    <option key={type} value={type} className="bg-black">
                      {type}
                    </option>
                  ))}
                </select>
              </CamvelleInnerPanel>

              <CamvelleInnerPanel className="p-5">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-transparent text-white outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-black">
                      {status}
                    </option>
                  ))}
                </select>
              </CamvelleInnerPanel>

              <InputBubble
                label="Sent Date"
                type="date"
                value={form.sent_date}
                onChange={(value) => setForm({ ...form, sent_date: value })}
              />

              <InputBubble
                label="Signed Date"
                type="date"
                value={form.signed_date}
                onChange={(value) => setForm({ ...form, signed_date: value })}
              />

              <CamvelleInnerPanel className="p-5 md:col-span-2">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Notes
                </label>

                <textarea
                  rows={6}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Agreement details, client notes, usage rights, payment terms, delivery notes..."
                  className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                />
              </CamvelleInnerPanel>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={createContract}
                disabled={creating}
                className={`${camvelleCreamButton} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <FileSignature size={15} />
                {creating ? "Creating Contract" : "Create Contract"}
              </button>

              <Link
                href={`/dashboard/clients/${client.id}`}
                className={camvelleGhostButton}
              >
                <X size={15} />
                Cancel
              </Link>
            </div>
          </CamvellePanel>
        </>
      )}
    </CamvellePageShell>
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
    <CamvelleInnerPanel className="p-5">
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
    </CamvelleInnerPanel>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <CamvelleInnerPanel className="p-5">
      <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </p>

      <p className="mt-4 break-words text-base leading-7 text-white/65">
        {value}
      </p>
    </CamvelleInnerPanel>
  );
}
