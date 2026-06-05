"use client"

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

type Invoice = {
  id: string;
  invoice_number?: string | null;
  amount?: number | string | null;
  total?: number | string | null;
  status?: string | null;
  due_date?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  notes?: string | null;
  invoice_pdf_url?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type Expense = {
  id: string;
  expense_date?: string | null;
  date?: string | null;
  vendor?: string | null;
  category?: string | null;
  amount?: number | string | null;
  payment_method?: string | null;
  description?: string | null;
  status?: string | null;

  file_path?: string | null;
  file_name?: string | null;
  file_url?: string | null;

  receipt_file_name?: string | null;
  receipt_file_path?: string | null;
  receipt_file_url?: string | null;

  created_at?: string | null;
};

type DateRange = "all" | "this_month" | "this_year";

const sections = [
  { label: "Overview", value: "overview" },
  { label: "Clients", value: "clients" },
  { label: "Bookings", value: "bookings" },
  { label: "Calendar", value: "calendar" },
  { label: "Galleries", value: "galleries" },
  { label: "Expenses", value: "expenses" },
];

const EXPENSE_BUCKET = "expense-files";

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [savingInvoiceId, setSavingInvoiceId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(
    null
  );
  const [reportRange, setReportRange] = useState<DateRange>("all");
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadFinanceData();
  }, []);

  async function loadFinanceData() {
    setLoading(true);
    setNotice("");

    const [invoiceResult, expenseResult] = await Promise.all([
      supabase.from("invoices").select("*"),
      supabase.from("expenses").select("*"),
    ]);

    if (invoiceResult.error) {
      alert(invoiceResult.error.message);
      setLoading(false);
      return;
    }

    if (expenseResult.error) {
      alert(expenseResult.error.message);
      setLoading(false);
      return;
    }

    const sortedInvoices = [...(invoiceResult.data || [])].sort((a, b) => {
      return (
        getSortTime(b.created_at || b.sent_at || b.paid_at || b.due_date) -
        getSortTime(a.created_at || a.sent_at || a.paid_at || a.due_date)
      );
    });

    const sortedExpenses = [...(expenseResult.data || [])].sort((a, b) => {
      return getSortTime(getExpenseDate(b)) - getSortTime(getExpenseDate(a));
    });

    setInvoices(sortedInvoices as Invoice[]);
    setExpenses(sortedExpenses as Expense[]);
    setLoading(false);
  }

  async function openExpenseFile(expense: Expense) {
    const storagePath =
      normalizeExpenseStoragePath(expense.receipt_file_path) ||
      normalizeExpenseStoragePath(expense.file_path);

    let storageError = "";

    if (storagePath) {
      const { data, error } = await supabase.storage
        .from(EXPENSE_BUCKET)
        .createSignedUrl(storagePath, 300);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        return;
      }

      storageError = error?.message || "Could not open file.";
    }

    const directUrl =
      normalizeDirectUrl(expense.receipt_file_url) ||
      normalizeDirectUrl(expense.file_url);

    if (directUrl) {
      window.open(directUrl, "_blank", "noopener,noreferrer");
      return;
    }

    alert(storageError || "No receipt file found.");
  }

  async function updateInvoiceStatus(invoice: Invoice, status: string) {
    setSavingInvoiceId(invoice.id);
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

    setSavingInvoiceId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Invoice updated successfully.");
    await loadFinanceData();
  }

  async function deleteInvoice(invoice: Invoice) {
    const confirmDelete = confirm(
      `Delete ${invoice.invoice_number || "this invoice"}?`
    );

    if (!confirmDelete) return;

    setDeletingInvoiceId(invoice.id);
    setNotice("");

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoice.id);

    setDeletingInvoiceId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Invoice deleted successfully.");
    await loadFinanceData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function generateCurrentReport() {
    setReportGeneratedAt(new Date().toISOString());
    setNotice("Finance report generated.");
  }

  function printFinanceReport() {
    const generatedAt = reportGeneratedAt || new Date().toISOString();

    const html = buildFinanceReportHtml({
      reportRange,
      generatedAt,
      invoices: reportInvoices,
      expenses: reportExpenses,
      totals,
    });

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Allow popups to print or save this report.");
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  const reportInvoices = useMemo(() => {
    return invoices.filter((invoice) =>
      isWithinRange(getInvoiceReportDate(invoice), reportRange)
    );
  }, [invoices, reportRange]);

  const reportExpenses = useMemo(() => {
    return expenses.filter((expense) =>
      isWithinRange(getExpenseDate(expense), reportRange)
    );
  }, [expenses, reportRange]);

  const totals = useMemo(() => {
    const totalBilled = reportInvoices.reduce((sum, invoice) => {
      return sum + getInvoiceAmount(invoice);
    }, 0);

    const paidIncome = reportInvoices
      .filter((invoice) => String(invoice.status || "").toLowerCase() === "paid")
      .reduce((sum, invoice) => {
        return sum + getInvoiceAmount(invoice);
      }, 0);

    const outstanding = reportInvoices
      .filter((invoice) => String(invoice.status || "").toLowerCase() !== "paid")
      .reduce((sum, invoice) => {
        return sum + getInvoiceAmount(invoice);
      }, 0);

    const expenseTotal = reportExpenses.reduce((sum, expense) => {
      return sum + moneyToNumber(expense.amount);
    }, 0);

    return {
      totalBilled,
      paidIncome,
      outstanding,
      expenseTotal,
      netProfit: paidIncome - expenseTotal,
    };
  }, [reportInvoices, reportExpenses]);

  const visibleInvoices = useMemo(() => {
    const term = invoiceSearch.toLowerCase().trim();

    return reportInvoices.filter((invoice) => {
      const searchable = [
        invoice.invoice_number,
        invoice.client_name,
        invoice.client_email,
        invoice.status,
        invoice.due_date,
        invoice.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [reportInvoices, invoiceSearch]);

  const visibleExpenses = useMemo(() => {
    const term = expenseSearch.toLowerCase().trim();

    return reportExpenses.filter((expense) => {
      const searchable = [
        expense.vendor,
        expense.category,
        expense.payment_method,
        expense.description,
        expense.status,
        expense.file_name,
        expense.receipt_file_name,
        getExpenseDate(expense),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [reportExpenses, expenseSearch]);

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
        <CamvelleEyebrow>Finance Management</CamvelleEyebrow>

        <CamvelleHeading>
          Studio
          <br />
          Finance.
        </CamvelleHeading>

        <CamvelleBody>
          Track invoices, income, expenses, outstanding balances, and printable
          financial reports.
        </CamvelleBody>

        <div className="mx-auto mt-12 w-full max-w-sm">
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
            className="w-full rounded-full border border-white/10 bg-black/20 px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white outline-none transition duration-500 hover:border-white/20"
          >
            <option value="finance" className="bg-black">
              Finance
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

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Income vs Expenses</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
              Current report.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/50">
              Review your income, expenses, net profit estimate, and outstanding
              invoice balance.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={generateCurrentReport}
              className={camvelleCreamButton}
            >
              Generate Report
            </button>

            <button
              type="button"
              onClick={printFinanceReport}
              className={camvelleGhostButton}
            >
              Print / PDF
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <label className="mb-2 block text-[10px] uppercase tracking-[0.35em] text-white/35">
              Report Range
            </label>

            <select
              value={reportRange}
              onChange={(e) => setReportRange(e.target.value as DateRange)}
              className="w-full bg-transparent text-white outline-none"
            >
              <option value="all" className="bg-black">
                All Time
              </option>
              <option value="this_month" className="bg-black">
                This Month
              </option>
              <option value="this_year" className="bg-black">
                This Year
              </option>
            </select>
          </div>

          <p className="rounded-full border border-white/10 bg-black/20 px-6 py-4 text-[10px] uppercase tracking-[0.28em] text-white/45">
            {reportGeneratedAt
              ? `Generated ${formatDateTime(reportGeneratedAt)}`
              : "Report not generated yet"}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Billed" value={formatMoney(totals.totalBilled)} />
          <StatCard title="Paid Income" value={formatMoney(totals.paidIncome)} />
          <StatCard title="Expenses" value={formatMoney(totals.expenseTotal)} />
          <StatCard title="Net Estimate" value={formatMoney(totals.netProfit)} />
          <StatCard title="Outstanding" value={formatMoney(totals.outstanding)} />
        </div>
      </CamvellePanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <CamvellePanel className="p-7 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <CamvelleEyebrow>Invoice Income</CamvelleEyebrow>

              <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
                Invoices.
              </h2>
            </div>

            <button
              type="button"
              onClick={loadFinanceData}
              className={camvelleGhostButton}
            >
              Refresh
            </button>
          </div>

          <div className="mt-8 rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <input
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>

          {loading && <p className="mt-10 text-white/50">Loading invoices...</p>}

          {!loading && visibleInvoices.length === 0 && (
            <CamvelleInnerPanel className="mt-10 p-6 text-white/50">
              No invoices found for this range.
            </CamvelleInnerPanel>
          )}

          <div className="mt-10 grid gap-4">
            {visibleInvoices.map((invoice, index) => (
              <CamvelleInnerPanel key={invoice.id} className="p-5 md:p-6">
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
                      {formatMoney(getInvoiceAmount(invoice))}
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
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                    <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                      Update Status
                    </label>

                    <select
                      value={invoice.status || "draft"}
                      disabled={savingInvoiceId === invoice.id}
                      onChange={(e) => updateInvoiceStatus(invoice, e.target.value)}
                      className="w-full bg-transparent text-white outline-none disabled:opacity-50"
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

                  <div className="flex flex-wrap gap-3">
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

                    <button
                      type="button"
                      onClick={() => deleteInvoice(invoice)}
                      disabled={deletingInvoiceId === invoice.id}
                      className="inline-flex items-center justify-center gap-3 rounded-full border border-red-400/20 bg-red-500/10 px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      {deletingInvoiceId === invoice.id ? "Deleting" : "Delete"}
                    </button>
                  </div>
                </div>
              </CamvelleInnerPanel>
            ))}
          </div>
        </CamvellePanel>

        <CamvellePanel className="p-7 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <CamvelleEyebrow>Business Expenses</CamvelleEyebrow>

              <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
                Expenses.
              </h2>
            </div>

            <Link href="/dashboard/expenses" className={camvelleCreamButton}>
              Add Expense
            </Link>
          </div>

          <div className="mt-8 rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <input
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>

          {loading && <p className="mt-10 text-white/50">Loading expenses...</p>}

          {!loading && visibleExpenses.length === 0 && (
            <CamvelleInnerPanel className="mt-10 p-6 text-white/50">
              No expenses found for this range.
            </CamvelleInnerPanel>
          )}

          <div className="mt-10 grid gap-4">
            {visibleExpenses.map((expense, index) => {
              const expenseHasFile = hasExpenseFile(expense);
              const fileLabel = getExpenseFileLabel(expense);

              return (
                <CamvelleInnerPanel key={expense.id} className="p-5 md:p-6">
                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                        {String(index + 1).padStart(2, "0")} / Expense
                      </p>

                      <h3 className="mt-3 break-words text-4xl font-light tracking-[-0.06em]">
                        {expense.vendor || "Expense"}
                      </h3>

                      <p className="mt-4 text-lg text-white/55">
                        {expense.category || "Uncategorized"}
                      </p>

                      <div className="mt-5">
                        <CamvelleStatusPill status={expense.status || "recorded"} />
                      </div>

                      <p className="mt-6 text-5xl font-light tracking-[-0.07em]">
                        {formatMoney(moneyToNumber(expense.amount))}
                      </p>

                      <div className="mt-6 grid gap-3 text-sm leading-7 text-white/45">
                        <p>
                          <span className="text-white/30">Date:</span>{" "}
                          {formatDate(getExpenseDate(expense)) || "Not provided"}
                        </p>

                        <p>
                          <span className="text-white/30">Payment:</span>{" "}
                          {expense.payment_method || "Not provided"}
                        </p>

                        <p>
                          <span className="text-white/30">File:</span>{" "}
                          {fileLabel}
                        </p>

                        {expense.description && (
                          <p className="whitespace-pre-wrap">
                            <span className="text-white/30">Notes:</span>{" "}
                            {expense.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {expenseHasFile && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => openExpenseFile(expense)}
                          className={camvelleCreamButton}
                        >
                          Open File
                        </button>
                      </div>
                    )}
                  </div>
                </CamvelleInnerPanel>
              );
            })}
          </div>
        </CamvellePanel>
      </div>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <CamvelleEyebrow>Finance Tools</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-6xl">
              Quick actions.
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/invoices" className={camvelleGhostButton}>
              Invoices
            </Link>

            <Link href="/dashboard/expenses" className={camvelleGhostButton}>
              Expenses
            </Link>

            <button
              type="button"
              onClick={printFinanceReport}
              className={camvelleCreamButton}
            >
              Save PDF
            </button>
          </div>
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

function getInvoiceAmount(invoice: Invoice) {
  return moneyToNumber(invoice.amount ?? invoice.total ?? 0);
}

function getInvoiceReportDate(invoice: Invoice) {
  return (
    invoice.paid_at ||
    invoice.sent_at ||
    invoice.created_at ||
    invoice.due_date ||
    null
  );
}

function getExpenseDate(expense: Expense) {
  return expense.expense_date || expense.date || expense.created_at || null;
}

function hasExpenseFile(expense: Expense) {
  return Boolean(
    expense.receipt_file_url ||
      expense.receipt_file_path ||
      expense.file_url ||
      expense.file_path
  );
}

function getExpenseFileLabel(expense: Expense) {
  return (
    expense.receipt_file_name ||
    expense.file_name ||
    getFileNameFromPath(expense.receipt_file_path) ||
    getFileNameFromPath(expense.file_path) ||
    getFileNameFromUrl(expense.receipt_file_url) ||
    getFileNameFromUrl(expense.file_url) ||
    "No file attached"
  );
}

function getFileNameFromPath(value: string | null | undefined) {
  const text = String(value || "").trim();

  if (!text) return null;

  const parts = text.split("/");
  return parts[parts.length - 1] || null;
}

function getFileNameFromUrl(value: string | null | undefined) {
  const text = String(value || "").trim();

  if (!text) return null;

  try {
    const url = new URL(text);
    const parts = url.pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "") || null;
  } catch {
    return null;
  }
}

function normalizeDirectUrl(value: string | null | undefined) {
  const text = String(value || "").trim();

  if (!text) return null;

  if (text.startsWith("http://") || text.startsWith("https://")) {
    return text;
  }

  return null;
}

function normalizeExpenseStoragePath(value: string | null | undefined) {
  const text = String(value || "").trim();

  if (!text) return null;

  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const url = new URL(text);

      const publicMarker = `/object/public/${EXPENSE_BUCKET}/`;
      const signedMarker = `/object/sign/${EXPENSE_BUCKET}/`;

      if (url.pathname.includes(publicMarker)) {
        return decodeURIComponent(url.pathname.split(publicMarker)[1] || "");
      }

      if (url.pathname.includes(signedMarker)) {
        return decodeURIComponent(url.pathname.split(signedMarker)[1] || "");
      }

      return null;
    } catch {
      return null;
    }
  }

  let cleaned = text.replace(/^\/+/, "");

  if (cleaned.startsWith(`${EXPENSE_BUCKET}/`)) {
    cleaned = cleaned.slice(`${EXPENSE_BUCKET}/`.length);
  }

  return cleaned || null;
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

function isWithinRange(value: string | null | undefined, range: DateRange) {
  if (range === "all") return true;
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (range === "this_month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  if (range === "this_year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
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

function getSortTime(value: string | null | undefined) {
  if (!value) return 0;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 0;

  return date.getTime();
}

function reportRangeLabel(range: DateRange) {
  if (range === "this_month") return "This Month";
  if (range === "this_year") return "This Year";
  return "All Time";
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildFinanceReportHtml({
  reportRange,
  generatedAt,
  invoices,
  expenses,
  totals,
}: {
  reportRange: DateRange;
  generatedAt: string;
  invoices: Invoice[];
  expenses: Expense[];
  totals: {
    totalBilled: number;
    paidIncome: number;
    outstanding: number;
    expenseTotal: number;
    netProfit: number;
  };
}) {
  const invoiceRows = invoices
    .map((invoice) => {
      return `
        <tr>
          <td>${escapeHtml(invoice.invoice_number || "Invoice")}</td>
          <td>${escapeHtml(invoice.client_name || invoice.client_email || "")}</td>
          <td>${escapeHtml(invoice.status || "draft")}</td>
          <td>${escapeHtml(formatDate(getInvoiceReportDate(invoice)) || "")}</td>
          <td class="money">${escapeHtml(formatMoney(getInvoiceAmount(invoice)))}</td>
        </tr>
      `;
    })
    .join("");

  const expenseRows = expenses
    .map((expense) => {
      return `
        <tr>
          <td>${escapeHtml(formatDate(getExpenseDate(expense)) || "")}</td>
          <td>${escapeHtml(expense.vendor || "Expense")}</td>
          <td>${escapeHtml(expense.category || "")}</td>
          <td>${escapeHtml(expense.payment_method || "")}</td>
          <td class="money">${escapeHtml(formatMoney(moneyToNumber(expense.amount)))}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <title>Camvelle Finance Report</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 40px;
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            background: #fff;
          }

          .header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 24px;
            margin-bottom: 28px;
          }

          .eyebrow {
            font-size: 11px;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #777;
          }

          h1 {
            margin: 12px 0 0;
            font-size: 44px;
            letter-spacing: -0.04em;
          }

          h2 {
            margin-top: 36px;
            font-size: 24px;
          }

          .meta {
            margin-top: 10px;
            color: #666;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
            margin: 30px 0;
          }

          .card {
            border: 1px solid #ddd;
            border-radius: 18px;
            padding: 18px;
          }

          .card-label {
            font-size: 10px;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #777;
          }

          .card-value {
            margin-top: 12px;
            font-size: 22px;
            font-weight: 700;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            font-size: 13px;
          }

          th {
            text-align: left;
            border-bottom: 1px solid #222;
            padding: 10px 8px;
            font-size: 10px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
          }

          td {
            border-bottom: 1px solid #e5e5e5;
            padding: 10px 8px;
            vertical-align: top;
          }

          .money {
            text-align: right;
            white-space: nowrap;
          }

          @media print {
            body {
              padding: 24px;
            }

            .summary {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div class="eyebrow">Camvelle Creative</div>
          <h1>Finance Report</h1>
          <div class="meta">Range: ${escapeHtml(reportRangeLabel(reportRange))}</div>
          <div class="meta">Generated: ${escapeHtml(formatDateTime(generatedAt) || "")}</div>
        </div>

        <div class="summary">
          <div class="card">
            <div class="card-label">Total Billed</div>
            <div class="card-value">${escapeHtml(formatMoney(totals.totalBilled))}</div>
          </div>

          <div class="card">
            <div class="card-label">Paid Income</div>
            <div class="card-value">${escapeHtml(formatMoney(totals.paidIncome))}</div>
          </div>

          <div class="card">
            <div class="card-label">Expenses</div>
            <div class="card-value">${escapeHtml(formatMoney(totals.expenseTotal))}</div>
          </div>

          <div class="card">
            <div class="card-label">Net Estimate</div>
            <div class="card-value">${escapeHtml(formatMoney(totals.netProfit))}</div>
          </div>

          <div class="card">
            <div class="card-label">Outstanding</div>
            <div class="card-value">${escapeHtml(formatMoney(totals.outstanding))}</div>
          </div>
        </div>

        <h2>Invoices</h2>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Status</th>
              <th>Date</th>
              <th class="money">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoiceRows ||
              `<tr><td colspan="5">No invoices found for this report.</td></tr>`
            }
          </tbody>
        </table>

        <h2>Expenses</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Payment</th>
              <th class="money">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              expenseRows ||
              `<tr><td colspan="5">No expenses found for this report.</td></tr>`
            }
          </tbody>
        </table>
      </body>
    </html>
  `;
}
