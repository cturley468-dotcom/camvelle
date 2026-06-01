"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle,
  DollarSign,
  Pencil,
  ReceiptText,
  Save,
  Send,
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
  created_at: string | null;
};

const sections = [
  "overview",
  "clients",
  "bookings",
  "calendar",
  "contracts",
  "galleries",
  "finance",
];

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

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
    status: "",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id, full_name, email, phone, notes, created_at")
      .order("created_at", { ascending: false });

    if (clientError) {
      alert(clientError.message);
      setLoading(false);
      return;
    }

    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (invoiceError) {
      alert(invoiceError.message);
      setLoading(false);
      return;
    }

    setClients(clientData || []);
    setInvoices(invoiceData || []);
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
    setOpenId(invoice.id);
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

  async function saveInvoice(id: string) {
    setSavingId(id);
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
      .eq("id", id);

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

    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", invoice.id);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Invoice marked ${status}.`);
    await loadData();
  }

  async function deleteInvoice(id: string) {
    const confirmDelete = confirm("Delete this invoice?");
    if (!confirmDelete) return;

    setDeletingId(id);
    setNotice("");

    const { error } = await supabase.from("invoices").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setOpenId(null);
    setEditingId(null);
    setNotice("Invoice deleted successfully.");
    await loadData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredInvoices = useMemo(() => {
    const term = search.toLowerCase();

    return invoices.filter((invoice) => {
      return (
        invoice.client_name?.toLowerCase().includes(term) ||
        invoice.client_email?.toLowerCase().includes(term) ||
        invoice.invoice_number?.toLowerCase().includes(term) ||
        invoice.status?.toLowerCase().includes(term) ||
        invoice.notes?.toLowerCase().includes(term)
      );
    });
  }, [invoices, search]);

  const totalAmount = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

  const paidAmount = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

  const outstandingAmount = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status !== "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

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
              Invoice Management
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Billing
              <br />
              Creative HQ.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              Create invoices, track payment status, manage outstanding balances,
              and keep client billing organized.
            </p>

            <div className="mx-auto mt-14 w-full max-w-sm">
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
                className="w-full rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white outline-none transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <option value="invoices" className="bg-black">
                  Invoices
                </option>

                {sections.map((section) => (
                  <option key={section} value={section} className="bg-black">
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mx-auto mt-6 grid w-full gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Invoices" value={String(invoices.length)} />
            <StatCard title="Total Billed" value={formatMoney(totalAmount)} />
            <StatCard title="Paid" value={formatMoney(paidAmount)} />
            <StatCard title="Outstanding" value={formatMoney(outstandingAmount)} />
          </div>

          {/* CREATE INVOICE */}
          <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              New Invoice
            </p>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
              Create billing record.
            </h2>

            <div className="mt-8 rounded-[2.25rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
              <div className="grid gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
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

                  <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
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

                <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
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
                  className="rounded-full bg-[#f5f0e7] px-7 py-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>

          {/* INVOICE LIST */}
          <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Invoice Records
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Billing queue.
                </h2>
              </div>

              <div className="w-full max-w-md rounded-full border border-white/10 bg-white/[0.025] px-6 py-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                />
              </div>
            </div>

            {notice && (
              <div className="mt-8 rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
                {notice}
              </div>
            )}

            {loading && <p className="mt-10 text-white/50">Loading invoices...</p>}

            {!loading && filteredInvoices.length === 0 && (
              <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-black/55 p-7 text-white/50">
                No invoices found.
              </div>
            )}

            <div className="mt-10 grid gap-4">
              {filteredInvoices.map((invoice, index) => {
                const isOpen = openId === invoice.id;
                const isEditing = editingId === invoice.id;

                return (
                  <div
                    key={invoice.id}
                    className="mx-auto w-full max-w-3xl rounded-[2.25rem] border border-white/10 bg-white/[0.035] p-5 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                          {String(index + 1).padStart(2, "0")} / Invoice
                        </p>

                        <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] md:text-4xl">
                          {invoice.client_name || "Unnamed Client"}
                        </h3>

                        <div className="mt-3 grid gap-1 text-sm leading-6 text-white/50">
                          <p>{invoice.invoice_number || "No invoice number"}</p>
                          <p>{formatMoney(Number(invoice.amount || 0))}</p>
                          <p>{invoice.status || "draft"}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(isOpen ? null : invoice.id);
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
                            <span className="text-white/30">Client:</span>{" "}
                            {invoice.client_name || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Email:</span>{" "}
                            {invoice.client_email || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Invoice:</span>{" "}
                            {invoice.invoice_number || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Amount:</span>{" "}
                            {formatMoney(Number(invoice.amount || 0))}
                          </p>

                          <p>
                            <span className="text-white/30">Status:</span>{" "}
                            {invoice.status || "draft"}
                          </p>

                          <p>
                            <span className="text-white/30">Due Date:</span>{" "}
                            {invoice.due_date || "Not provided"}
                          </p>

                          <p>
                            <span className="text-white/30">Created:</span>{" "}
                            {invoice.created_at
                              ? new Date(invoice.created_at).toLocaleDateString()
                              : "Not provided"}
                          </p>

                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                              Notes
                            </p>

                            <p className="mt-3 whitespace-pre-wrap text-white/55">
                              {invoice.notes || "No notes saved."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <IconButton
                            label="Edit"
                            icon={<Pencil size={16} />}
                            onClick={() => startEdit(invoice)}
                          />

                          <IconButton
                            label="Mark Sent"
                            icon={<Send size={16} />}
                            onClick={() => updateInvoiceStatus(invoice, "sent")}
                            disabled={savingId === invoice.id}
                          />

                          <IconButton
                            label="Mark Paid"
                            icon={<CheckCircle size={16} />}
                            onClick={() => updateInvoiceStatus(invoice, "paid")}
                            disabled={savingId === invoice.id}
                          />

                          <IconButton
                            label="Delete"
                            danger
                            icon={<Trash2 size={16} />}
                            onClick={() => deleteInvoice(invoice.id)}
                            disabled={deletingId === invoice.id}
                          />
                        </div>
                      </div>
                    )}

                    {isOpen && isEditing && (
                      <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]">
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
                              setEditForm({
                                ...editForm,
                                invoice_number: value,
                              })
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

                          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
                            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                              Status
                            </label>

                            <select
                              value={editForm.status}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  status: e.target.value,
                                })
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
                            label="Save"
                            icon={<Save size={16} />}
                            onClick={() => saveInvoice(invoice.id)}
                            disabled={savingId === invoice.id}
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="mx-auto w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
        {title}
      </p>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">
        {value}
      </h3>
    </div>
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
