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

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
};

type Invoice = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  invoice_pdf_url?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
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

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    client_id: "",
    invoice_number: "",
    amount: "",
    status: "draft",
    due_date: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    client_id: "",
    client_name: "",
    client_email: "",
    invoice_number: "",
    amount: "",
    status: "draft",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setNotice("");

    const [clientResult, invoiceResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, email, phone, notes, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (clientResult.error) {
      alert(clientResult.error.message);
      setLoading(false);
      return;
    }

    if (invoiceResult.error) {
      alert(invoiceResult.error.message);
      setLoading(false);
      return;
    }

    setClients(clientResult.data || []);
    setInvoices(invoiceResult.data || []);
    setLoading(false);
  }

  function selectedClientForCreate() {
    return clients.find((client) => client.id === createForm.client_id);
  }

  async function createInvoice() {
    const client = selectedClientForCreate();

    if (!client) {
      alert("Choose a client first.");
      return;
    }

    if (!createForm.amount) {
      alert("Enter an invoice amount.");
      return;
    }

    setCreating(true);
    setNotice("");

    const { error } = await supabase.from("invoices").insert({
      client_id: client.id,
      client_name: client.full_name,
      client_email: client.email,
      invoice_number:
        createForm.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
      amount: Number(createForm.amount),
      status: createForm.status || "draft",
      due_date: createForm.due_date || null,
      notes: createForm.notes || null,
    });

    setCreating(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCreateForm({
      client_id: "",
      invoice_number: "",
      amount: "",
      status: "draft",
      due_date: "",
      notes: "",
    });

    setNotice("Invoice created successfully.");
    await loadData();
  }

  function startEdit(invoice: Invoice) {
    setNotice("");
    setEditingId(invoice.id);

    setEditForm({
      client_id: invoice.client_id || "",
      client_name: invoice.client_name || "",
      client_email: invoice.client_email || "",
      invoice_number: invoice.invoice_number || "",
      amount:
        invoice.amount === null || invoice.amount === undefined
          ? ""
          : String(invoice.amount),
      status: invoice.status || "draft",
      due_date: invoice.due_date || "",
      notes: invoice.notes || "",
    });
  }

  async function saveInvoice(invoiceId: string) {
    setSavingId(invoiceId);
    setNotice("");

    const { error } = await supabase
      .from("invoices")
      .update({
        client_id: editForm.client_id || null,
        client_name: editForm.client_name || null,
        client_email: editForm.client_email || null,
        invoice_number: editForm.invoice_number || null,
        amount: editForm.amount ? Number(editForm.amount) : 0,
        status: editForm.status || "draft",
        due_date: editForm.due_date || null,
        notes: editForm.notes || null,
      })
      .eq("id", invoiceId);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setNotice("Invoice updated successfully.");
    await loadData();
  }

  async function updateInvoiceStatus(invoice: Invoice, status: string) {
    setSavingId(invoice.id);
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
      .eq("id", invoice.id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Invoice marked ${status}.`);
    await loadData();
  }

  async function generateInvoicePdf(invoice: Invoice) {
    setSavingId(invoice.id);
    setNotice("");

    const response = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });

    const result = await response.json();

    setSavingId(null);

    if (!response.ok) {
      alert(result.error || "Invoice PDF could not be generated.");
      return;
    }

    setNotice("Invoice PDF generated successfully.");
    await loadData();
  }

  async function sendInvoice(invoice: Invoice) {
    setSavingId(invoice.id);
    setNotice("");

    const response = await fetch("/api/invoices/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });

    const result = await response.json();

    setSavingId(null);

    if (!response.ok) {
      alert(result.error || "Invoice could not be sent.");
      return;
    }

    setNotice("Invoice sent successfully.");
    await loadData();
  }

  async function deleteInvoice(invoice: Invoice) {
    const confirmDelete = confirm(
      `Delete ${invoice.invoice_number || "this invoice"}?`
    );

    if (!confirmDelete) return;

    setDeletingId(invoice.id);
    setNotice("");

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoice.id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setNotice("Invoice deleted successfully.");
    await loadData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredInvoices = useMemo(() => {
    const term = search.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const searchable = [
        invoice.client_name,
        invoice.client_email,
        invoice.invoice_number,
        invoice.status,
        invoice.due_date,
        invoice.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [invoices, search]);

  const totalAmount = useMemo(() => {
    return invoices.reduce((sum, invoice) => {
      return sum + moneyToNumber(invoice.amount);
    }, 0);
  }, [invoices]);

  const paidAmount = useMemo(() => {
    return invoices
      .filter((invoice) => String(invoice.status || "").toLowerCase() === "paid")
      .reduce((sum, invoice) => sum + moneyToNumber(invoice.amount), 0);
  }, [invoices]);

  const outstandingAmount = useMemo(() => {
    return invoices
      .filter((invoice) => String(invoice.status || "").toLowerCase() !== "paid")
      .reduce((sum, invoice) => sum + moneyToNumber(invoice.amount), 0);
  }, [invoices]);

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
        <CamvelleEyebrow>Invoice Management</CamvelleEyebrow>

        <CamvelleHeading>
          Billing
          <br />
          Creative HQ.
        </CamvelleHeading>

        <CamvelleBody>
          Create invoices, generate PDFs, send billing emails, track payments,
          and keep every client balance organized.
        </CamvelleBody>

        <div className="mx-auto mt-12 w-full max-w-sm">
          <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
            Navigate
          </label>

          <select
            defaultValue="invoices"
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
            <option value="invoices" className="bg-black">
              Invoices
            </option>

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
        <StatCard title="Total Invoices" value={String(invoices.length)} />
        <StatCard title="Total Billed" value={formatMoney(totalAmount)} />
        <StatCard title="Paid" value={formatMoney(paidAmount)} />
        <StatCard title="Outstanding" value={formatMoney(outstandingAmount)} />
      </div>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>New Invoice</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
              Create billing record.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
              Create a quick invoice from any saved client. PDFs and emails can
              be generated after the invoice is created.
            </p>
          </div>
        </div>

        <CamvelleInnerPanel className="mt-8 p-5 md:p-7">
          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
              <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                Client
              </label>

              <select
                value={createForm.client_id}
                onChange={(e) =>
                  setCreateForm({ ...createForm, client_id: e.target.value })
                }
                className="w-full bg-transparent text-white outline-none"
              >
                <option value="" className="bg-black">
                  Select client
                </option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id} className="bg-black">
                    {client.full_name || client.email || "Unnamed Client"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputBubble
                label="Invoice Number"
                value={createForm.invoice_number}
                placeholder="Auto if blank"
                onChange={(value) =>
                  setCreateForm({ ...createForm, invoice_number: value })
                }
              />

              <InputBubble
                label="Amount"
                type="number"
                value={createForm.amount}
                placeholder="0.00"
                onChange={(value) =>
                  setCreateForm({ ...createForm, amount: value })
                }
              />

              <InputBubble
                label="Due Date"
                type="date"
                value={createForm.due_date}
                onChange={(value) =>
                  setCreateForm({ ...createForm, due_date: value })
                }
              />

              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                  Status
                </label>

                <select
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, status: e.target.value })
                  }
                  className="w-full bg-transparent text-white outline-none"
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
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
              <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                Notes
              </label>

              <textarea
                rows={4}
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
                placeholder="Session package, deposit, remaining balance, payment notes..."
                className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
              />
            </div>

            <button
              type="button"
              onClick={createInvoice}
              disabled={creating}
              className={camvelleCreamButton}
            >
              {creating ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </CamvelleInnerPanel>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Invoice Records</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
              Billing queue.
            </h2>
          </div>

          <div className="w-full max-w-md rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        {loading && <p className="mt-10 text-white/50">Loading invoices...</p>}

        {!loading && filteredInvoices.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-6 text-white/50">
            No invoices found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-4">
          {filteredInvoices.map((invoice, index) => {
            const isEditing = editingId === invoice.id;

            return (
              <CamvelleInnerPanel key={invoice.id} className="p-5 md:p-6">
                {!isEditing && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                        {String(index + 1).padStart(2, "0")} / Invoice
                      </p>

                      <h3 className="mt-3 break-words text-4xl font-light tracking-[-0.06em]">
                        {invoice.invoice_number || "No invoice number"}
                      </h3>

                      <p className="mt-4 text-lg text-white/55">
                        {invoice.client_name || invoice.client_email || "No client listed"}
                      </p>

                      <div className="mt-5">
                        <CamvelleStatusPill status={invoice.status || "draft"} />
                      </div>

                      <p className="mt-6 text-5xl font-light tracking-[-0.07em]">
                        {formatMoney(moneyToNumber(invoice.amount))}
                      </p>

                      <div className="mt-6 grid gap-3 text-sm leading-7 text-white/45">
                        <p>
                          <span className="text-white/30">Client Email:</span>{" "}
                          {invoice.client_email || "Not provided"}
                        </p>

                        <p>
                          <span className="text-white/30">Due Date:</span>{" "}
                          {invoice.due_date || "Not provided"}
                        </p>

                        <p>
                          <span className="text-white/30">Sent:</span>{" "}
                          {formatDateTime(invoice.sent_at) || "Not provided"}
                        </p>

                        <p>
                          <span className="text-white/30">Paid:</span>{" "}
                          {formatDateTime(invoice.paid_at) || "Not provided"}
                        </p>

                        {invoice.notes && (
                          <p className="whitespace-pre-wrap">
                            <span className="text-white/30">Notes:</span>{" "}
                            {invoice.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(invoice)}
                        className={camvelleGhostButton}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => updateInvoiceStatus(invoice, "sent")}
                        disabled={savingId === invoice.id}
                        className={camvelleGhostButton}
                      >
                        Mark Sent
                      </button>

                      <button
                        type="button"
                        onClick={() => updateInvoiceStatus(invoice, "paid")}
                        disabled={savingId === invoice.id}
                        className={camvelleGhostButton}
                      >
                        Mark Paid
                      </button>

                      {invoice.invoice_pdf_url ? (
                        <a
                          href={invoice.invoice_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className={camvelleCreamButton}
                        >
                          View PDF
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => generateInvoicePdf(invoice)}
                          disabled={savingId === invoice.id}
                          className={camvelleCreamButton}
                        >
                          Generate PDF
                        </button>
                      )}

                      {invoice.invoice_pdf_url && (
                        <button
                          type="button"
                          onClick={() => sendInvoice(invoice)}
                          disabled={savingId === invoice.id}
                          className={camvelleCreamButton}
                        >
                          Send Invoice
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteInvoice(invoice)}
                        disabled={deletingId === invoice.id}
                        className="inline-flex items-center justify-center gap-3 rounded-full border border-red-400/20 bg-red-500/10 px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        {deletingId === invoice.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="grid gap-4">
                    <InputBubble
                      label="Client Name"
                      value={editForm.client_name}
                      onChange={(value) =>
                        setEditForm({ ...editForm, client_name: value })
                      }
                    />

                    <InputBubble
                      label="Client Email"
                      value={editForm.client_email}
                      onChange={(value) =>
                        setEditForm({ ...editForm, client_email: value })
                      }
                    />

                    <InputBubble
                      label="Invoice Number"
                      value={editForm.invoice_number}
                      onChange={(value) =>
                        setEditForm({ ...editForm, invoice_number: value })
                      }
                    />

                    <InputBubble
                      label="Amount"
                      type="number"
                      value={editForm.amount}
                      onChange={(value) =>
                        setEditForm({ ...editForm, amount: value })
                      }
                    />

                    <InputBubble
                      label="Due Date"
                      type="date"
                      value={editForm.due_date}
                      onChange={(value) =>
                        setEditForm({ ...editForm, due_date: value })
                      }
                    />

                    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                        Status
                      </label>

                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                        className="w-full bg-transparent text-white outline-none"
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

                    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                        Notes
                      </label>

                      <textarea
                        rows={5}
                        value={editForm.notes}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
                        }
                        className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => saveInvoice(invoice.id)}
                        disabled={savingId === invoice.id}
                        className={camvelleCreamButton}
                      >
                        {savingId === invoice.id ? "Saving" : "Save"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={camvelleGhostButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
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

function moneyToNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
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
