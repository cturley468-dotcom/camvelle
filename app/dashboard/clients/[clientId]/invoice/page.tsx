"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ReceiptText, X } from "lucide-react";
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

const statusOptions = ["draft", "sent", "paid", "overdue"];

export default function CreateClientInvoicePage() {
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
    invoice_number: "",
    amount: "",
    status: "draft",
    due_date: "",
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

  async function createInvoice() {
    if (!client) {
      alert("Client not found.");
      return;
    }

    if (!form.amount) {
      alert("Enter an invoice amount.");
      return;
    }

    setCreating(true);
    setNotice("");

    const { data: newInvoice, error } = await supabase
      .from("invoices")
      .insert({
        client_id: client.id,
        client_name: client.full_name,
        client_email: client.email,
        invoice_number:
          form.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
        amount: Number(form.amount),
        status: form.status || "draft",
        due_date: form.due_date || null,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (error || !newInvoice) {
      setCreating(false);
      alert(error?.message || "Invoice could not be created.");
      return;
    }

    const pdfResponse = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoiceId: newInvoice.id,
      }),
    });

    const pdfResult = await pdfResponse.json();

    setCreating(false);

    if (!pdfResponse.ok) {
      alert(pdfResult.error || "Invoice created, but PDF could not be generated.");
      router.push(`/dashboard/clients/${client.id}`);
      return;
    }

    setNotice("Invoice created and PDF generated successfully.");
    router.push(`/dashboard/clients/${client.id}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const previewInvoiceNumber = useMemo(() => {
    return form.invoice_number || "Auto generated";
  }, [form.invoice_number]);

  const previewAmount = useMemo(() => {
    return form.amount ? formatMoney(Number(form.amount)) : "$0.00";
  }, [form.amount]);

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
        <CamvelleEyebrow>Client Invoice</CamvelleEyebrow>

        <CamvelleHeading>
          Create
          <br />
          billing record.
        </CamvelleHeading>

        <CamvelleBody>
          Create an invoice directly inside this client file. Once saved, the PDF
          will be generated and the invoice will appear on the client profile.
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
                <CamvelleEyebrow>Billing For</CamvelleEyebrow>

                <h2 className="mt-6 break-words text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white md:text-6xl">
                  {client.full_name || "Unnamed Client"}
                </h2>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
                  Review the client and invoice preview before creating the billing
                  record.
                </p>
              </div>

              <CamvelleStatusPill status={form.status || "draft"} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <InfoCard label="Email" value={client.email || "Not provided"} />
              <InfoCard label="Phone" value={client.phone || "Not provided"} />
              <InfoCard label="Invoice" value={previewInvoiceNumber} />
              <InfoCard label="Amount" value={previewAmount} />
            </div>
          </CamvellePanel>

          <CamvellePanel className="mt-6 p-7 md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <CamvelleEyebrow>New Invoice</CamvelleEyebrow>

                <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white md:text-6xl">
                  Invoice
                  <br />
                  details.
                </h2>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
                  Add the amount, due date, status, and payment notes. The invoice
                  PDF will generate automatically after creation.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
                <ReceiptText size={18} />
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <InputBubble
                label="Invoice Number"
                value={form.invoice_number}
                placeholder="Auto if blank"
                onChange={(value) =>
                  setForm({ ...form, invoice_number: value })
                }
              />

              <InputBubble
                label="Amount"
                type="number"
                value={form.amount}
                placeholder="0.00"
                onChange={(value) => setForm({ ...form, amount: value })}
              />

              <InputBubble
                label="Due Date"
                type="date"
                value={form.due_date}
                onChange={(value) => setForm({ ...form, due_date: value })}
              />

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

              <CamvelleInnerPanel className="p-5 md:col-span-2">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Notes
                </label>

                <textarea
                  rows={6}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Package, deposit, balance, payment notes..."
                  className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                />
              </CamvelleInnerPanel>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={createInvoice}
                disabled={creating}
                className={`${camvelleCreamButton} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <ReceiptText size={15} />
                {creating ? "Creating Invoice" : "Create Invoice"}
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
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
