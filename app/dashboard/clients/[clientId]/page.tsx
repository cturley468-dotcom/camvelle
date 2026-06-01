"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
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

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();

  const clientId = Array.isArray(params.clientId)
    ? params.clientId[0]
    : params.clientId;

  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const [editing, setEditing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    if (clientId) loadClientPage();
  }, [clientId]);

  async function loadClientPage() {
    setLoading(true);

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id, full_name, email, phone, notes, created_at")
      .eq("id", clientId)
      .single();

    if (clientError) {
      alert(clientError.message);
      setLoading(false);
      return;
    }

    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .or(
        `client_id.eq.${clientId},client_email.eq.${clientData.email || ""}`
      )
      .order("created_at", { ascending: false });

    if (invoiceError) {
      alert(invoiceError.message);
      setLoading(false);
      return;
    }

    setClient(clientData);
    setInvoices(invoiceData || []);
    setEditForm({
      full_name: clientData.full_name || "",
      email: clientData.email || "",
      phone: clientData.phone || "",
      notes: clientData.notes || "",
    });
    setScheduleDate(getScheduledDate(clientData.notes) || "");
    setLoading(false);
  }

  async function saveClient() {
    if (!client) return;

    setSaving(true);
    setNotice("");

    const { error } = await supabase
      .from("clients")
      .update({
        full_name: editForm.full_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        notes: editForm.notes || null,
      })
      .eq("id", client.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditing(false);
    setNotice("Client updated successfully.");
    await loadClientPage();
  }

  async function saveSchedule() {
    if (!client) return;

    if (!scheduleDate) {
      alert("Choose a schedule date first.");
      return;
    }

    setSaving(true);
    setNotice("");

    const { error } = await supabase
      .from("clients")
      .update({
        notes: addScheduledDateToNotes(client.notes, scheduleDate),
      })
      .eq("id", client.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setScheduling(false);
    setNotice("Client schedule updated.");
    await loadClientPage();
  }

  async function removeSchedule() {
    if (!client) return;

    const confirmRemove = confirm("Remove scheduled date?");
    if (!confirmRemove) return;

    setSaving(true);
    setNotice("");

    const { error } = await supabase
      .from("clients")
      .update({
        notes: removeScheduledDateFromNotes(client.notes),
      })
      .eq("id", client.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setScheduleDate("");
    setScheduling(false);
    setNotice("Scheduled date removed.");
    await loadClientPage();
  }

  async function updateInvoiceStatus(invoiceId: string, status: string) {
    setSaving(true);
    setNotice("");

    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", invoiceId);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Invoice marked ${status}.`);
    await loadClientPage();
  }

  async function deleteInvoice(invoiceId: string) {
    const confirmDelete = confirm("Delete this invoice?");
    if (!confirmDelete) return;

    setDeleting(true);
    setNotice("");

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Invoice deleted.");
    await loadClientPage();
  }

  async function deleteClient() {
    if (!client) return;

    const confirmDelete = confirm("Delete this client?");
    if (!confirmDelete) return;

    setDeleting(true);
    setNotice("");

    const { error } = await supabase.from("clients").delete().eq("id", client.id);

    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard/clients");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const invoiceTotal = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

  const outstandingTotal = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status !== "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }, [invoices]);

  const scheduledDate = getScheduledDate(client?.notes || null);

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
              Client Profile
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              {loading ? "Loading" : client?.full_name || "Unnamed"}
              <br />
              Client File.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              Manage client details, schedule, contracts, invoices, and session
              notes in one dedicated client page.
            </p>

            <div className="mx-auto mt-12 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/clients"
                className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
              >
                Back to Clients
              </Link>

              {client && (
                <Link
                  href={`/dashboard/clients/${client.id}/invoice`}
                  className="rounded-full bg-[#f5f0e7] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-white"
                >
                  Create Invoice
                </Link>
              )}
            </div>
          </div>

          {notice && (
            <div className="mx-auto mt-6 w-full max-w-3xl rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
              {notice}
            </div>
          )}

          {loading && (
            <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-white/50">
              Loading client file...
            </div>
          )}

          {!loading && !client && (
            <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-white/50">
              Client not found.
            </div>
          )}

          {client && (
            <>
              <div className="mx-auto mt-6 grid w-full gap-5 md:grid-cols-3">
                <StatCard title="Invoices" value={String(invoices.length)} />
                <StatCard title="Total Billed" value={formatMoney(invoiceTotal)} />
                <StatCard
                  title="Outstanding"
                  value={formatMoney(outstandingTotal)}
                />
              </div>

              <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Client Details
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Session profile.
                </h2>

                {!editing && !scheduling && (
                  <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)] md:p-7">
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
                        <span className="text-white/30">Scheduled:</span>{" "}
                        {scheduledDate || "Not scheduled"}
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

                    <div className="mt-7 flex flex-wrap gap-3">
                      <IconButton
                        label="Edit"
                        icon={<Pencil size={16} />}
                        onClick={() => {
                          setEditing(true);
                          setScheduling(false);
                        }}
                      />

                      <IconButton
                        label="Schedule"
                        icon={<Calendar size={16} />}
                        onClick={() => {
                          setScheduling(true);
                          setEditing(false);
                        }}
                      />

                      <IconLink
                        label="Contract"
                        href={`/dashboard/contracts?clientId=${client.id}`}
                        icon={<FileSignature size={16} />}
                      />

                      <IconLink
                        label="Create Invoice"
                        href={`/dashboard/clients/${client.id}/invoice`}
                        icon={<ReceiptText size={16} />}
                      />

                      <IconButton
                        label="Delete"
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={deleteClient}
                        disabled={deleting}
                      />
                    </div>
                  </div>
                )}

                {editing && (
                  <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)] md:p-7">
                    <div className="grid gap-4">
                      <InputBubble
                        label="Full Name"
                        value={editForm.full_name}
                        onChange={(value) =>
                          setEditForm({ ...editForm, full_name: value })
                        }
                      />

                      <InputBubble
                        label="Email"
                        value={editForm.email}
                        onChange={(value) =>
                          setEditForm({ ...editForm, email: value })
                        }
                      />

                      <InputBubble
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
                          rows={6}
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

                    <div className="mt-7 flex flex-wrap gap-3">
                      <IconButton
                        label="Save"
                        icon={<Save size={16} />}
                        onClick={saveClient}
                        disabled={saving}
                      />

                      <IconButton
                        label="Cancel"
                        icon={<X size={16} />}
                        onClick={() => setEditing(false)}
                      />
                    </div>
                  </div>
                )}

                {scheduling && (
                  <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)] md:p-7">
                    <InputBubble
                      label="Schedule Date"
                      type="date"
                      value={scheduleDate}
                      onChange={setScheduleDate}
                    />

                    <div className="mt-7 flex flex-wrap gap-3">
                      <IconButton
                        label="Save Schedule"
                        icon={<Save size={16} />}
                        onClick={saveSchedule}
                        disabled={saving}
                      />

                      <IconButton
                        label="Remove Schedule"
                        icon={<X size={16} />}
                        onClick={removeSchedule}
                        disabled={saving}
                        danger
                      />

                      <IconButton
                        label="Cancel"
                        icon={<X size={16} />}
                        onClick={() => setScheduling(false)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                      Invoice Records
                    </p>

                    <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                      Billing history.
                    </h2>
                  </div>

                  <Link
                    href={`/dashboard/clients/${client.id}/invoice`}
                    className="rounded-full bg-[#f5f0e7] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-white"
                  >
                    New Invoice
                  </Link>
                </div>

                {invoices.length === 0 && (
                  <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/55 p-6 text-white/50">
                    No invoices created for this client yet.
                  </div>
                )}

                <div className="mt-10 grid gap-4">
                  {invoices.map((invoice, index) => (
                    <div
                      key={invoice.id}
                      className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]"
                    >
                      <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                        {String(index + 1).padStart(2, "0")} / Invoice
                      </p>

                      <h3 className="mt-3 text-3xl font-light tracking-[-0.06em]">
                        {invoice.invoice_number || "No invoice number"}
                      </h3>

                      <div className="mt-5 grid gap-3 text-sm leading-7 text-white/55">
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
                          {invoice.due_date || "Not set"}
                        </p>

                        <p>
                          <span className="text-white/30">Notes:</span>{" "}
                          {invoice.notes || "No notes saved."}
                        </p>
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <IconButton
                          label="Mark Sent"
                          icon={<ReceiptText size={16} />}
                          onClick={() => updateInvoiceStatus(invoice.id, "sent")}
                          disabled={saving}
                        />

                        <IconButton
                          label="Mark Paid"
                          icon={<CheckCircle size={16} />}
                          onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                          disabled={saving}
                        />

                        <IconButton
                          label="Delete Invoice"
                          icon={<Trash2 size={16} />}
                          onClick={() => deleteInvoice(invoice.id)}
                          disabled={deleting}
                          danger
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function getScheduledDate(notes: string | null) {
  if (!notes) return null;

  const match = notes.match(/^Scheduled Date:\s*(\d{4}-\d{2}-\d{2})/im);
  return match?.[1] || null;
}

function removeScheduledDateFromNotes(notes: string | null) {
  return (notes || "")
    .replace(/^Scheduled Date:\s*\d{4}-\d{2}-\d{2}\s*\n*/im, "")
    .trim();
}

function addScheduledDateToNotes(notes: string | null, date: string) {
  const cleaned = removeScheduledDateFromNotes(notes);

  return [`Scheduled Date: ${date}`, cleaned].filter(Boolean).join("\n\n");
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

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">{value}</h3>
    </div>
  );
}

function InputBubble({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
