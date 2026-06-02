"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle,
  FileSignature,
  Inbox,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
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

type Invoice = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  invoice_number: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  invoice_pdf_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string | null;
};

type Contract = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  contract_type: string | null;
  status: string | null;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string | null;
};

type Inquiry = {
  id: string;
  full_name: string | null;
  email: string | null;
  service_type: string | null;
  created_at: string | null;
};

const sections = ["overview", "clients", "bookings", "calendar", "galleries"];

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadFinance();
  }, []);

  async function loadFinance() {
    setLoading(true);

    const [invoiceResult, contractResult, inquiryResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("contracts")
        .select(
          "id, client_id, client_name, client_email, contract_type, status, sent_at, signed_at, created_at"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("inquiries")
        .select("id, full_name, email, service_type, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (invoiceResult.error) {
      alert(invoiceResult.error.message);
      setLoading(false);
      return;
    }

    if (contractResult.error) {
      alert(contractResult.error.message);
      setLoading(false);
      return;
    }

    if (inquiryResult.error) {
      alert(inquiryResult.error.message);
      setLoading(false);
      return;
    }

    setInvoices(invoiceResult.data || []);
    setContracts(contractResult.data || []);
    setInquiries(inquiryResult.data || []);
    setLoading(false);
  }

  async function updateInvoiceStatus(invoiceId: string, status: string) {
    setSavingId(invoiceId);
    setNotice("");

    const updateData: Record<string, string | null> = {
      status,
    };

    if (status === "sent") {
      updateData.sent_at = new Date().toISOString();
    }

    if (status === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Invoice marked ${formatStatus(status)}.`);
    await loadFinance();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const totalBilled = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

  const paidTotal = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

  const outstandingTotal = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status !== "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

  const openInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status !== "paid").length;
  }, [invoices]);

  const signedContracts = useMemo(() => {
    return contracts.filter((contract) => contract.status === "signed").length;
  }, [contracts]);

  const estimatedLeadValue = useMemo(() => {
    return inquiries.length * 400;
  }, [inquiries.length]);

  const filteredInvoices = useMemo(() => {
    const term = search.toLowerCase();

    return invoices.filter((invoice) => {
      return (
        invoice.invoice_number?.toLowerCase().includes(term) ||
        invoice.client_name?.toLowerCase().includes(term) ||
        invoice.client_email?.toLowerCase().includes(term) ||
        invoice.status?.toLowerCase().includes(term) ||
        invoice.due_date?.toLowerCase().includes(term) ||
        invoice.notes?.toLowerCase().includes(term)
      );
    });
  }, [invoices, search]);

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
        <CamvelleEyebrow>Finance Management</CamvelleEyebrow>

        <CamvelleHeading>
          Finance
          <br />
          HQ
        </CamvelleHeading>

        <CamvelleBody>
          Track invoices, paid revenue, outstanding balances, and business
          performance.
        </CamvelleBody>

        <div className="mx-auto mt-12 w-full max-w-xl text-left">
          <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
            Navigate
          </label>

          <select
            defaultValue="finance"
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
            <option value="finance" className="bg-black">
              Finance
            </option>

            {sections.map((section) => (
              <option key={section} value={section} className="bg-black">
                {section}
              </option>
            ))}
          </select>
        </div>
      </CamvellePanel>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Billed"
          value={loading ? "..." : formatMoney(totalBilled)}
          detail="All invoice value"
          icon={<ReceiptText size={18} />}
        />

        <StatCard
          title="Paid"
          value={loading ? "..." : formatMoney(paidTotal)}
          detail="Collected invoice value"
          icon={<CheckCircle size={18} />}
        />

        <StatCard
          title="Outstanding"
          value={loading ? "..." : formatMoney(outstandingTotal)}
          detail={`${openInvoices} open invoice${openInvoices === 1 ? "" : "s"}`}
          icon={<Wallet size={18} />}
        />

        <StatCard
          title="Lead Estimate"
          value={loading ? "..." : formatMoney(estimatedLeadValue)}
          detail={`${inquiries.length} inquiry estimate`}
          icon={<Inbox size={18} />}
        />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <StatCard
          title="Invoices"
          value={loading ? "..." : String(invoices.length)}
          detail="Total invoice records"
          icon={<ReceiptText size={18} />}
        />

        <StatCard
          title="Signed Contracts"
          value={loading ? "..." : `${signedContracts}/${contracts.length}`}
          detail="Completed agreements"
          icon={<FileSignature size={18} />}
        />
      </div>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Invoice Records</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Billing
              <br />
              overview.
            </h2>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <Search size={16} className="text-white/35" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        {notice && (
          <div className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {loading && <p className="mt-10 text-white/50">Loading finance data...</p>}

        {!loading && filteredInvoices.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
            No invoices found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-4">
          {filteredInvoices.map((invoice, index) => (
            <CamvelleInnerPanel
              key={invoice.id}
              className="mx-auto w-full max-w-4xl p-5 md:p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                    {String(index + 1).padStart(2, "0")} / Invoice
                  </p>

                  <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] text-white md:text-4xl">
                    {invoice.invoice_number || "No invoice number"}
                  </h3>

                  <p className="mt-3 break-words text-sm leading-6 text-white/50">
                    {invoice.client_name || invoice.client_email || "No client listed"}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <CamvelleStatusPill status={formatStatus(invoice.status || "draft")} />

                  <p className="text-3xl font-light tracking-[-0.06em] text-white">
                    {formatMoney(Number(invoice.amount || 0))}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 text-sm leading-7 text-white/55 md:grid-cols-2">
                <DetailLine label="Client Email" value={invoice.client_email} />
                <DetailLine label="Due Date" value={invoice.due_date} />
                <DetailLine label="Sent" value={formatDateTime(invoice.sent_at)} />
                <DetailLine label="Paid" value={formatDateTime(invoice.paid_at)} />
              </div>

              <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-5">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Update Status
                </label>

                <select
                  value={invoice.status || "draft"}
                  onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value)}
                  disabled={savingId === invoice.id}
                  className="w-full rounded-full border border-white/10 bg-black/20 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.25em] text-white outline-none disabled:opacity-50"
                >
                  <option value="draft" className="bg-black">
                    Draft
                  </option>
                  <option value="sent" className="bg-black">
                    Sent
                  </option>
                  <option value="paid" className="bg-black">
                    Paid
                  </option>
                  <option value="overdue" className="bg-black">
                    Overdue
                  </option>
                </select>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {invoice.client_id && (
                  <Link
                    href={`/dashboard/clients/${invoice.client_id}`}
                    className={camvelleGhostButton}
                  >
                    Open Client
                  </Link>
                )}

                {invoice.invoice_pdf_url && (
                  <a
                    href={invoice.invoice_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className={camvelleCreamButton}
                  >
                    View PDF
                  </a>
                )}
              </div>
            </CamvelleInnerPanel>
          ))}
        </div>
      </CamvellePanel>
    </CamvellePageShell>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <CamvellePanel className="p-7">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
          {icon}
        </div>
      </div>

      <h3 className="mt-7 text-4xl font-light tracking-[-0.06em] text-white">
        {value}
      </h3>

      <p className="mt-5 text-sm leading-6 text-white/40">{detail}</p>
    </CamvellePanel>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <p>
      <span className="text-white/30">{label}:</span>{" "}
      {value || "Not provided"}
    </p>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function formatStatus(status: string | null) {
  const value = String(status || "draft").trim();

  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
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
