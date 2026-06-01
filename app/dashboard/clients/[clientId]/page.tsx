"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  FileSignature,
  FileText,
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
  sent_date: string | null;
  signed_date: string | null;
  notes: string | null;
  contract_pdf_url: string | null;
  signed_pdf_url: string | null;
  signature_image_url: string | null;
  signing_token: string | null;
  signed_name: string | null;
  signed_email: string | null;
  signed_at: string | null;
  sent_at: string | null;
  created_at: string | null;
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string | null;
  sortTime: number;
  type: "invoice" | "contract" | "client";
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();

  const clientId = Array.isArray(params.clientId)
    ? params.clientId[0]
    : params.clientId;

  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function loadClientPage() {
    if (!clientId) return;

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
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (invoiceError) {
      alert(invoiceError.message);
      setLoading(false);
      return;
    }

    const { data: contractData, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (contractError) {
      alert(contractError.message);
      setLoading(false);
      return;
    }

    setClient(clientData);
    setInvoices(invoiceData || []);
    setContracts(contractData || []);

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

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Invoice status updated to ${formatStatus(status)}.`);
    await loadClientPage();
  }

  async function generateInvoicePdf(invoiceId: string) {
    setSaving(true);
    setNotice("");

    const response = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoiceId }),
    });

    const result = await response.json();

    setSaving(false);

    if (!response.ok) {
      alert(result.error || "PDF could not be generated.");
      return;
    }

    setNotice("Invoice PDF generated successfully.");
    await loadClientPage();
  }

  async function sendInvoice(invoiceId: string) {
    setSaving(true);
    setNotice("");

    const response = await fetch("/api/invoices/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoiceId }),
    });

    const result = await response.json();

    setSaving(false);

    if (!response.ok) {
      alert(result.error || "Invoice could not be sent.");
      return;
    }

    setNotice("Invoice sent successfully.");
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

  async function updateContractStatus(contractId: string, status: string) {
    setSaving(true);
    setNotice("");

    const today = new Date().toISOString().slice(0, 10);

    const updateData: Record<string, string | null> = {
      status,
    };

    if (status === "sent") {
      updateData.sent_date = today;
      updateData.sent_at = new Date().toISOString();
    }

    if (status === "signed") {
      updateData.signed_date = today;
      updateData.signed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", contractId);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice(`Contract status updated to ${formatStatus(status)}.`);
    await loadClientPage();
  }

  async function sendContract(contractId: string) {
    setSaving(true);
    setNotice("");

    const response = await fetch("/api/contracts/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractId }),
    });

    const result = await response.json();

    setSaving(false);

    if (!response.ok) {
      alert(result.error || "Contract could not be sent.");
      return;
    }

    setNotice("Contract sent successfully.");
    await loadClientPage();
  }

  async function deleteContract(contractId: string) {
    const confirmDelete = confirm("Delete this contract?");
    if (!confirmDelete) return;

    setDeleting(true);
    setNotice("");

    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);

    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Contract deleted.");
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

  const signedContracts = useMemo(() => {
    return contracts.filter((contract) => contract.status === "signed").length;
  }, [contracts]);

  const activity = useMemo(() => {
    return buildActivity(client, invoices, contracts);
  }, [client, invoices, contracts]);

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
              Manage details, schedule, contracts, invoices, PDFs, email status,
              and session notes from one dedicated client page.
            </p>

            <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/clients"
                className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
              >
                Back to Clients
              </Link>

              {client && (
                <>
                  <Link
                    href={`/dashboard/clients/${client.id}/contract`}
                    className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
                  >
                    Create Contract
                  </Link>

                  <Link
                    href={`/dashboard/clients/${client.id}/invoice`}
                    className="rounded-full bg-[#f5f0e7] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-white"
                  >
                    Create Invoice
                  </Link>
                </>
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
              <div className="mx-auto mt-6 grid w-full gap-5 md:grid-cols-5">
                <StatCard title="Invoices" value={String(invoices.length)} />
                <StatCard title="Contracts" value={String(contracts.length)} />
                <StatCard title="Signed" value={String(signedContracts)} />
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
                    <div className="grid gap-4 text-sm leading-7 text-white/55 md:grid-cols-2">
                      <DetailLine label="Name" value={client.full_name} />
                      <DetailLine label="Email" value={client.email} />
                      <DetailLine label="Phone" value={client.phone} />
                      <DetailLine label="Scheduled" value={scheduledDate} />
                      <DetailLine
                        label="Created"
                        value={
                          client.created_at
                            ? new Date(client.created_at).toLocaleDateString()
                            : null
                        }
                      />

                      <div className="md:col-span-2">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                          Notes
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-white/55">
                          {client.notes || "No notes saved."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <ActionButton
                        label="Edit Client"
                        icon={<Pencil size={16} />}
                        onClick={() => {
                          setEditing(true);
                          setScheduling(false);
                        }}
                      />

                      <ActionButton
                        label="Schedule"
                        icon={<Calendar size={16} />}
                        onClick={() => {
                          setScheduling(true);
                          setEditing(false);
                        }}
                      />

                      <ActionLink
                        label="New Contract"
                        href={`/dashboard/clients/${client.id}/contract`}
                        icon={<FileSignature size={16} />}
                      />

                      <ActionLink
                        label="New Invoice"
                        href={`/dashboard/clients/${client.id}/invoice`}
                        icon={<ReceiptText size={16} />}
                      />

                      <ActionButton
                        label="Delete Client"
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
                      <ActionButton
                        label="Save Client"
                        icon={<Save size={16} />}
                        onClick={saveClient}
                        disabled={saving}
                      />

                      <ActionButton
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
                      <ActionButton
                        label="Save Schedule"
                        icon={<Save size={16} />}
                        onClick={saveSchedule}
                        disabled={saving}
                      />

                      <ActionButton
                        label="Remove Schedule"
                        icon={<X size={16} />}
                        onClick={removeSchedule}
                        disabled={saving}
                        danger
                      />

                      <ActionButton
                        label="Cancel"
                        icon={<X size={16} />}
                        onClick={() => setScheduling(false)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <RecordSection
                title="Contract Records"
                heading="Agreement history."
                emptyText="No contracts created for this client yet."
                actionHref={`/dashboard/clients/${client.id}/contract`}
                actionText="New Contract"
              >
                {contracts.map((contract, index) => (
                  <div
                    key={contract.id}
                    className="mx-auto w-full max-w-4xl rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)] md:p-7"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                          {String(index + 1).padStart(2, "0")} / Contract
                        </p>

                        <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] md:text-4xl">
                          {contract.contract_type || "Photography Agreement"}
                        </h3>
                      </div>

                      <StatusBadge status={contract.status || "draft"} />
                    </div>

                    <div className="mt-6 grid gap-4 text-sm leading-7 text-white/55 md:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 md:col-span-2">
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.35em] text-white/30">
                          Update Status
                        </label>

                        <select
                          value={contract.status || "draft"}
                          onChange={(e) =>
                            updateContractStatus(contract.id, e.target.value)
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

                      <DetailLine label="Sent To" value={contract.client_email} />
                      <DetailLine label="Sent Date" value={contract.sent_date} />
                      <DetailLine
                        label="Sent Time"
                        value={formatDateTime(contract.sent_at)}
                      />
                      <DetailLine label="Signed Date" value={contract.signed_date} />
                      <DetailLine label="Signed By" value={contract.signed_name} />
                      <DetailLine label="Signed Email" value={contract.signed_email} />
                      <DetailLine
                        label="Contract PDF"
                        value={contract.contract_pdf_url ? "Ready" : "Not generated"}
                      />
                      <DetailLine
                        label="Signed PDF"
                        value={contract.signed_pdf_url ? "Ready" : "Not signed yet"}
                      />

                      <div className="md:col-span-2">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                          Notes
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-white/55">
                          {contract.notes || "No notes saved."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <ActionButton
                        label={
                          contract.status === "sent" || contract.sent_at
                            ? "Resend Contract"
                            : "Send Contract"
                        }
                        icon={<Send size={16} />}
                        onClick={() => sendContract(contract.id)}
                        disabled={saving}
                      />

                      {contract.signing_token && (
                        <ActionLink
                          label="Open Signing Page"
                          href={`/contract-sign/${contract.signing_token}`}
                          icon={<ExternalLink size={16} />}
                        />
                      )}

                      {contract.contract_pdf_url && (
                        <ActionExternalLink
                          label="View Contract PDF"
                          href={contract.contract_pdf_url}
                          icon={<FileText size={16} />}
                        />
                      )}

                      {contract.signed_pdf_url && (
                        <ActionExternalLink
                          label="View Signed PDF"
                          href={contract.signed_pdf_url}
                          icon={<CheckCircle size={16} />}
                        />
                      )}

                      <ActionButton
                        label="Delete Contract"
                        icon={<Trash2 size={16} />}
                        onClick={() => deleteContract(contract.id)}
                        disabled={deleting}
                        danger
                      />
                    </div>
                  </div>
                ))}
              </RecordSection>

              <RecordSection
                title="Invoice Records"
                heading="Billing history."
                emptyText="No invoices created for this client yet."
                actionHref={`/dashboard/clients/${client.id}/invoice`}
                actionText="New Invoice"
              >
                {invoices.map((invoice, index) => (
                  <div
                    key={invoice.id}
                    className="mx-auto w-full max-w-4xl rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.03)] md:p-7"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                          {String(index + 1).padStart(2, "0")} / Invoice
                        </p>

                        <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] md:text-4xl">
                          {invoice.invoice_number || "No invoice number"}
                        </h3>
                      </div>

                      <StatusBadge status={invoice.status || "draft"} />
                    </div>

                    <div className="mt-6 grid gap-4 text-sm leading-7 text-white/55 md:grid-cols-2">
                      <DetailLine
                        label="Amount"
                        value={formatMoney(Number(invoice.amount || 0))}
                      />

                      <DetailLine label="Sent To" value={invoice.client_email} />

                      <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 md:col-span-2">
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.35em] text-white/30">
                          Update Status
                        </label>

                        <select
                          value={invoice.status || "draft"}
                          onChange={(e) =>
                            updateInvoiceStatus(invoice.id, e.target.value)
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

                      <DetailLine label="Due Date" value={invoice.due_date} />
                      <DetailLine
                        label="Sent Time"
                        value={formatDateTime(invoice.sent_at)}
                      />
                      <DetailLine
                        label="Paid Time"
                        value={formatDateTime(invoice.paid_at)}
                      />
                      <DetailLine
                        label="Invoice PDF"
                        value={invoice.invoice_pdf_url ? "Ready" : "Not generated"}
                      />

                      <div className="md:col-span-2">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
                          Notes
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-white/55">
                          {invoice.notes || "No notes saved."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      {invoice.invoice_pdf_url ? (
                        <ActionExternalLink
                          label="View Invoice PDF"
                          href={invoice.invoice_pdf_url}
                          icon={<FileText size={16} />}
                        />
                      ) : (
                        <ActionButton
                          label="Generate PDF"
                          icon={<FileText size={16} />}
                          onClick={() => generateInvoicePdf(invoice.id)}
                          disabled={saving}
                        />
                      )}

                      <ActionButton
                        label={
                          invoice.status === "sent" || invoice.sent_at
                            ? "Resend Invoice"
                            : "Send Invoice"
                        }
                        icon={<Send size={16} />}
                        onClick={() => sendInvoice(invoice.id)}
                        disabled={saving || !invoice.invoice_pdf_url}
                      />

                      <ActionButton
                        label="Delete Invoice"
                        icon={<Trash2 size={16} />}
                        onClick={() => deleteInvoice(invoice.id)}
                        disabled={deleting}
                        danger
                      />
                    </div>

                    {!invoice.invoice_pdf_url && (
                      <p className="mt-4 text-xs leading-6 text-white/35">
                        Generate the invoice PDF before sending this invoice.
                      </p>
                    )}
                  </div>
                ))}
              </RecordSection>

              <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
                <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                  Activity
                </p>

                <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                  Client timeline.
                </h2>

                {activity.length === 0 ? (
                  <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/55 p-6 text-white/50">
                    No activity recorded yet.
                  </div>
                ) : (
                  <div className="mt-10 grid gap-3">
                    {activity.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[2rem] border border-white/10 bg-black/55 p-5"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                              {item.type}
                            </p>

                            <h3 className="mt-2 text-xl font-light tracking-[-0.04em]">
                              {item.title}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-white/45">
                              {item.detail}
                            </p>
                          </div>

                          <p className="text-sm text-white/35">
                            {formatDateTime(item.time) || "Date not listed"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSortTime(value: string | null | undefined) {
  if (!value) return 0;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 0;

  return date.getTime();
}

function buildActivity(
  client: Client | null,
  invoices: Invoice[],
  contracts: Contract[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  if (client?.created_at) {
    items.push({
      id: `client-created-${client.id}`,
      title: "Client file created",
      detail: `${client.full_name || "Client"} was added to Camvelle.`,
      time: client.created_at,
      sortTime: getSortTime(client.created_at),
      type: "client",
    });
  }

  invoices.forEach((invoice) => {
    const number = invoice.invoice_number || "Invoice";

    if (invoice.created_at) {
      items.push({
        id: `invoice-created-${invoice.id}`,
        title: `${number} created`,
        detail: `${formatMoney(Number(invoice.amount || 0))} invoice record created.`,
        time: invoice.created_at,
        sortTime: getSortTime(invoice.created_at),
        type: "invoice",
      });
    }

    if (invoice.sent_at) {
      items.push({
        id: `invoice-sent-${invoice.id}`,
        title: `${number} sent`,
        detail: `Invoice emailed to ${invoice.client_email || "client"}.`,
        time: invoice.sent_at,
        sortTime: getSortTime(invoice.sent_at),
        type: "invoice",
      });
    }

    if (invoice.paid_at) {
      items.push({
        id: `invoice-paid-${invoice.id}`,
        title: `${number} paid`,
        detail: `${formatMoney(Number(invoice.amount || 0))} marked paid.`,
        time: invoice.paid_at,
        sortTime: getSortTime(invoice.paid_at),
        type: "invoice",
      });
    }
  });

  contracts.forEach((contract) => {
    const title = contract.contract_type || "Photography Agreement";

    if (contract.created_at) {
      items.push({
        id: `contract-created-${contract.id}`,
        title: `${title} created`,
        detail: "Contract record added to the client file.",
        time: contract.created_at,
        sortTime: getSortTime(contract.created_at),
        type: "contract",
      });
    }

    if (contract.sent_at || contract.sent_date) {
      items.push({
        id: `contract-sent-${contract.id}`,
        title: `${title} sent`,
        detail: `Signing email sent to ${contract.client_email || "client"}.`,
        time: contract.sent_at || contract.sent_date,
        sortTime: getSortTime(contract.sent_at || contract.sent_date),
        type: "contract",
      });
    }

    if (contract.signed_at || contract.signed_date) {
      items.push({
        id: `contract-signed-${contract.id}`,
        title: `${title} signed`,
        detail: `Signed by ${contract.signed_name || "client"}.`,
        time: contract.signed_at || contract.signed_date,
        sortTime: getSortTime(contract.signed_at || contract.signed_date),
        type: "contract",
      });
    }
  });

  return items.sort((a, b) => b.sortTime - a.sortTime).slice(0, 12);
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

function RecordSection({
  title,
  heading,
  emptyText,
  actionHref,
  actionText,
  children,
}: {
  title: string;
  heading: string;
  emptyText: string;
  actionHref: string;
  actionText: string;
  children: ReactNode;
}) {
  const hasChildren =
    Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="mx-auto mt-6 w-full rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
            {title}
          </p>

          <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
            {heading}
          </h2>
        </div>

        <Link
          href={actionHref}
          className="rounded-full bg-[#f5f0e7] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-white"
        >
          {actionText}
        </Link>
      </div>

      {!hasChildren && (
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/55 p-6 text-white/50">
          {emptyText}
        </div>
      )}

      <div className="mt-10 grid gap-4">{children}</div>
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

function StatusBadge({ status }: { status: string }) {
  const normalized = String(status || "draft").toLowerCase();

  const isGood = normalized === "paid" || normalized === "signed";
  const isWarning = normalized === "sent";
  const isDanger = normalized === "overdue";
  const isArchived = normalized === "archived";

  const className = isGood
    ? "border-green-400/20 bg-green-500/10 text-green-100"
    : isWarning
      ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-100"
      : isDanger
        ? "border-red-400/20 bg-red-500/10 text-red-100"
        : isArchived
          ? "border-white/10 bg-white/[0.04] text-white/40"
          : "border-white/10 bg-white/[0.04] text-white/60";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] ${className}`}
    >
      {isGood && <CheckCircle size={13} />}
      {formatStatus(normalized)}
    </div>
  );
}

function ActionButton({
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
      className={`group flex min-h-12 items-center gap-3 rounded-full border py-2 pl-2 pr-5 text-[10px] font-semibold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-red-400/20 bg-red-500/10 text-red-100 hover:bg-red-500/20"
          : "border-white/10 bg-white/[0.035] text-white/65 hover:bg-white hover:text-black"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full border ${
          danger
            ? "border-red-400/20 bg-red-500/10"
            : "border-white/10 bg-black/30 group-hover:border-black/10 group-hover:bg-black/5"
        }`}
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}

function ActionLink({
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
      className="group flex min-h-12 items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] py-2 pl-2 pr-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65 transition hover:bg-white hover:text-black"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 group-hover:border-black/10 group-hover:bg-black/5">
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}

function ActionExternalLink({
  label,
  icon,
  href,
}: {
  label: string;
  icon: ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      className="group flex min-h-12 items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] py-2 pl-2 pr-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65 transition hover:bg-white hover:text-black"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 group-hover:border-black/10 group-hover:bg-black/5">
        {icon}
      </span>

      <span>{label}</span>
    </a>
  );
}
