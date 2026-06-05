"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
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

type Contract = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  title?: string | null;
  contract_type: string | null;
  status: string | null;
  sent_date: string | null;
  signed_date: string | null;
  notes: string | null;
  contract_pdf_url?: string | null;
  signed_pdf_url?: string | null;
  signature_image_url?: string | null;
  signing_token?: string | null;
  signing_url?: string | null;
  signed_name?: string | null;
  signed_email?: string | null;
  signed_at?: string | null;
  sent_at?: string | null;
  created_at: string | null;
};

const sections = [
  { label: "Overview", value: "overview" },
  { label: "Clients", value: "clients" },
  { label: "Bookings", value: "bookings" },
  { label: "Calendar", value: "calendar" },
  { label: "Contracts", value: "contracts" },
  { label: "Invoices", value: "invoices" },
  { label: "Galleries", value: "galleries" },
  { label: "Finance", value: "finance" },
  { label: "Expenses", value: "expenses" },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    setLoading(true);
    setNotice("");

    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setContracts((data || []) as Contract[]);
    setLoading(false);
  }

  async function updateContractStatus(contract: Contract, status: string) {
    setSavingId(contract.id);
    setNotice("");

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    const updateData: Record<string, string | null> = {
      status,
    };

    if (status === "sent") {
      updateData.sent_date = today;
      updateData.sent_at = now;
    }

    if (status === "signed") {
      updateData.signed_date = today;
      updateData.signed_at = now;
    }

    const { error } = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", contract.id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Contract marked ${status}.`);
    await loadContracts();
  }

  async function sendContract(contract: Contract) {
    setSendingId(contract.id);
    setNotice("");

    const response = await fetch("/api/contracts/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractId: contract.id }),
    });

    const result = await response.json();

    setSendingId(null);

    if (!response.ok) {
      alert(result.error || "Contract could not be sent.");
      return;
    }

    setNotice("Contract sent successfully.");
    await loadContracts();
  }

  async function deleteContract(contract: Contract) {
    const confirmDelete = confirm(
      `Delete ${getContractTitle(contract)} for ${
        contract.client_name || contract.client_email || "this client"
      }?`
    );

    if (!confirmDelete) return;

    setDeletingId(contract.id);
    setNotice("");

    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contract.id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Contract deleted successfully.");
    await loadContracts();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredContracts = useMemo(() => {
    const term = search.toLowerCase().trim();

    return contracts.filter((contract) => {
      const searchable = [
        contract.client_name,
        contract.client_email,
        contract.title,
        contract.contract_type,
        contract.status,
        contract.sent_date,
        contract.signed_date,
        contract.signed_name,
        contract.signed_email,
        contract.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [contracts, search]);

  const signedCount = useMemo(() => {
    return contracts.filter(
      (contract) => String(contract.status || "").toLowerCase() === "signed"
    ).length;
  }, [contracts]);

  const sentCount = useMemo(() => {
    return contracts.filter(
      (contract) => String(contract.status || "").toLowerCase() === "sent"
    ).length;
  }, [contracts]);

  const draftCount = useMemo(() => {
    return contracts.filter(
      (contract) => String(contract.status || "draft").toLowerCase() === "draft"
    ).length;
  }, [contracts]);

  const archivedCount = useMemo(() => {
    return contracts.filter(
      (contract) => String(contract.status || "").toLowerCase() === "archived"
    ).length;
  }, [contracts]);

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

      <CamvellePanel className="p-8 text-center md:p-14">
        <CamvelleEyebrow>Contract Management</CamvelleEyebrow>

        <CamvelleHeading>
          Agreement
          <br />
          Creative HQ.
        </CamvelleHeading>

        <CamvelleBody>
          Review every agreement, track sent and signed status, open signed PDFs,
          send contracts, and manage client paperwork from one dashboard page.
        </CamvelleBody>

        <div className="mx-auto mt-12 w-full max-w-sm">
          <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
            Navigate
          </label>

          <select
            defaultValue="contracts"
            onChange={(e) => {
              if (e.target.value === "overview") {
                window.location.href = "/dashboard";
                return;
              }

              if (e.target.value) {
                window.location.href = `/dashboard/${e.target.value}`;
              }
            }}
            className="w-full rounded-full border border-white/10 bg-black/20 px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white outline-none transition duration-500 hover:border-white/20"
          >
            {sections.map((section) => (
              <option key={section.value} value={section.value} className="bg-black">
                {section.label}
              </option>
            ))}
          </select>
        </div>
      </CamvellePanel>

      {notice && (
        <div className="mt-6 rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
          {notice}
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Contracts" value={String(contracts.length)} />
        <StatCard title="Draft" value={String(draftCount)} />
        <StatCard title="Sent" value={String(sentCount)} />
        <StatCard title="Signed" value={String(signedCount)} />
      </div>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Contract Records</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
              Agreement queue.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
              Create new contracts from the individual client page. Use this
              page to monitor, send, review, and organize all agreements.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/clients" className={camvelleCreamButton}>
              Choose Client
            </Link>

            <button type="button" onClick={loadContracts} className={camvelleGhostButton}>
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-full border border-white/10 bg-black/20 px-6 py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts..."
            className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
          />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Archived" value={String(archivedCount)} />
          <StatCard
            title="Needs Signature"
            value={String(
              contracts.filter(
                (contract) =>
                  String(contract.status || "").toLowerCase() === "sent"
              ).length
            )}
          />
          <StatCard
            title="Completed"
            value={String(
              contracts.filter(
                (contract) =>
                  String(contract.status || "").toLowerCase() === "signed"
              ).length
            )}
          />
          <StatCard
            title="Visible Results"
            value={String(filteredContracts.length)}
          />
        </div>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>All Agreements</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
              Contracts.
            </h2>
          </div>
        </div>

        {loading && <p className="mt-10 text-white/50">Loading contracts...</p>}

        {!loading && filteredContracts.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-6 text-white/50">
            No contracts found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-4">
          {filteredContracts.map((contract, index) => {
            const contractTitle = getContractTitle(contract);
            const contractPdfUrl = getContractPdfUrl(contract);
            const signedPdfUrl = getSignedPdfUrl(contract);
            const signingUrl = getSigningUrl(contract);

            return (
              <CamvelleInnerPanel key={contract.id} className="p-5 md:p-6">
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                      {String(index + 1).padStart(2, "0")} / Contract
                    </p>

                    <h3 className="mt-3 break-words text-4xl font-light tracking-[-0.06em]">
                      {contractTitle}
                    </h3>

                    <p className="mt-4 text-lg text-white/55">
                      {contract.client_name ||
                        contract.client_email ||
                        "No client listed"}
                    </p>

                    <div className="mt-5">
                      <CamvelleStatusPill status={contract.status || "draft"} />
                    </div>

                    <div className="mt-6 grid gap-3 text-sm leading-7 text-white/45">
                      <p>
                        <span className="text-white/30">Client Email:</span>{" "}
                        {contract.client_email || "Not provided"}
                      </p>

                      <p>
                        <span className="text-white/30">Sent Date:</span>{" "}
                        {formatDate(contract.sent_date) ||
                          formatDateTime(contract.sent_at) ||
                          "Not sent"}
                      </p>

                      <p>
                        <span className="text-white/30">Signed Date:</span>{" "}
                        {formatDate(contract.signed_date) ||
                          formatDateTime(contract.signed_at) ||
                          "Not signed"}
                      </p>

                      <p>
                        <span className="text-white/30">Signed By:</span>{" "}
                        {contract.signed_name || "Not signed"}
                      </p>

                      <p>
                        <span className="text-white/30">Signed Email:</span>{" "}
                        {contract.signed_email || "Not signed"}
                      </p>

                      {contract.notes && (
                        <p className="whitespace-pre-wrap">
                          <span className="text-white/30">Notes:</span>{" "}
                          {contract.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                    <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                      Update Status
                    </label>

                    <select
                      value={contract.status || "draft"}
                      disabled={savingId === contract.id}
                      onChange={(e) =>
                        updateContractStatus(contract, e.target.value)
                      }
                      className="w-full bg-transparent text-white outline-none disabled:opacity-50"
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

                  <div className="flex flex-wrap gap-3">
                    {contract.client_id && (
                      <Link
                        href={`/dashboard/clients/${contract.client_id}`}
                        className={camvelleGhostButton}
                      >
                        Client File
                      </Link>
                    )}

                    {contractPdfUrl && (
                      <a
                        href={contractPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={camvelleGhostButton}
                      >
                        View PDF
                      </a>
                    )}

                    {signedPdfUrl && (
                      <a
                        href={signedPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={camvelleCreamButton}
                      >
                        Signed PDF
                      </a>
                    )}

                    {signingUrl && (
                      <a
                        href={signingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={camvelleGhostButton}
                      >
                        Signing Page
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => sendContract(contract)}
                      disabled={sendingId === contract.id}
                      className={camvelleCreamButton}
                    >
                      {sendingId === contract.id ? "Sending" : "Send Contract"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteContract(contract)}
                      disabled={deletingId === contract.id}
                      className="inline-flex items-center justify-center gap-3 rounded-full border border-red-400/20 bg-red-500/10 px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      {deletingId === contract.id ? "Deleting" : "Delete"}
                    </button>
                  </div>
                </div>
              </CamvelleInnerPanel>
            );
          })}
        </div>
      </CamvellePanel>
    </CamvellePageShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <CamvelleInnerPanel className="p-7">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">{value}</h3>
    </CamvelleInnerPanel>
  );
}

function getContractTitle(contract: Contract) {
  return (
    contract.title ||
    contract.contract_type ||
    "Photography Agreement"
  );
}

function getContractPdfUrl(contract: Contract) {
  if (contract.contract_pdf_url) return contract.contract_pdf_url;

  return `/api/contracts/pdf?contractId=${encodeURIComponent(contract.id)}`;
}

function getSignedPdfUrl(contract: Contract) {
  if (contract.signed_pdf_url) return contract.signed_pdf_url;

  const status = String(contract.status || "").toLowerCase();

  if (status === "signed" && contract.signing_token) {
    return `/api/contracts/pdf?token=${encodeURIComponent(
      contract.signing_token
    )}`;
  }

  return null;
}

function getSigningUrl(contract: Contract) {
  if (contract.signing_url) return contract.signing_url;

  if (contract.signing_token) {
    return `/contract-sign/${encodeURIComponent(contract.signing_token)}`;
  }

  return null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
