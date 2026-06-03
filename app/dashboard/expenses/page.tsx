"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Pencil,
  ReceiptText,
  Save,
  Search,
  Trash2,
  Upload,
  Wallet,
  X,
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

const EXPENSE_BUCKET = "expense-receipts";

type Expense = {
  id: string;
  expense_date: string | null;
  vendor: string | null;
  category: string | null;
  amount: number | null;
  payment_method: string | null;
  expense_type: string | null;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_url: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const sections = ["overview", "clients", "bookings", "calendar", "galleries", "finance"];

const categories = [
  "Equipment",
  "Software",
  "Travel",
  "Marketing",
  "Office",
  "Props",
  "Insurance",
  "Education",
  "Taxes",
  "Other",
];

const paymentMethods = [
  "Business Card",
  "Personal Card",
  "Cash",
  "Bank Transfer",
  "Check",
  "Other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    expense_date: toDateInputValue(new Date()),
    vendor: "",
    category: "Equipment",
    amount: "",
    payment_method: "Business Card",
    expense_type: "Receipt",
    description: "",
    status: "Recorded",
  });

  const [editForm, setEditForm] = useState({
    expense_date: "",
    vendor: "",
    category: "",
    amount: "",
    payment_method: "",
    expense_type: "",
    description: "",
    status: "",
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    setLoading(true);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setExpenses(data || []);
    setLoading(false);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function uploadFile(file: File) {
    const fileExtension = file.name.split(".").pop() || "file";
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const filePath = `expenses/${form.expense_date || toDateInputValue(new Date())}/${Date.now()}-${safeName}.${fileExtension}`;

    const { error } = await supabase.storage
      .from(EXPENSE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    return {
      filePath,
      fileName: file.name,
    };
  }

  async function createExpense() {
    if (!form.vendor.trim()) {
      alert("Vendor is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Amount is required.");
      return;
    }

    setUploading(true);
    setNotice("");

    try {
      let filePath: string | null = null;
      let fileName: string | null = null;

      if (selectedFile) {
        const uploaded = await uploadFile(selectedFile);
        filePath = uploaded.filePath;
        fileName = uploaded.fileName;
      }

      const { error } = await supabase.from("expenses").insert({
        expense_date: form.expense_date || null,
        vendor: form.vendor || null,
        category: form.category || null,
        amount: Number(form.amount || 0),
        payment_method: form.payment_method || null,
        expense_type: form.expense_type || null,
        description: form.description || null,
        file_path: filePath,
        file_name: fileName,
        file_url: null,
        status: form.status || "Recorded",
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setNotice("Expense saved successfully.");
      setSelectedFile(null);
      setForm({
        expense_date: toDateInputValue(new Date()),
        vendor: "",
        category: "Equipment",
        amount: "",
        payment_method: "Business Card",
        expense_type: "Receipt",
        description: "",
        status: "Recorded",
      });

      const fileInput = document.getElementById("expense-receipts") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await loadExpenses();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Expense could not be saved.";
      alert(message);
    } finally {
      setUploading(false);
    }
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setNotice("");

    setEditForm({
      expense_date: expense.expense_date || "",
      vendor: expense.vendor || "",
      category: expense.category || "Other",
      amount: String(expense.amount || ""),
      payment_method: expense.payment_method || "Other",
      expense_type: expense.expense_type || "Receipt",
      description: expense.description || "",
      status: expense.status || "Recorded",
    });
  }

  async function saveExpense(expenseId: string) {
    if (!editForm.vendor.trim()) {
      alert("Vendor is required.");
      return;
    }

    if (!editForm.amount || Number(editForm.amount) <= 0) {
      alert("Amount is required.");
      return;
    }

    setSavingId(expenseId);
    setNotice("");

    const { error } = await supabase
      .from("expenses")
      .update({
        expense_date: editForm.expense_date || null,
        vendor: editForm.vendor || null,
        category: editForm.category || null,
        amount: Number(editForm.amount || 0),
        payment_method: editForm.payment_method || null,
        expense_type: editForm.expense_type || null,
        description: editForm.description || null,
        status: editForm.status || "Recorded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    setSavingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setNotice("Expense updated successfully.");
    await loadExpenses();
  }

  async function deleteExpense(expense: Expense) {
    const confirmDelete = confirm("Delete this expense record?");
    if (!confirmDelete) return;

    setDeletingId(expense.id);
    setNotice("");

    if (expense.file_path) {
      await supabase.storage.from(EXPENSE_BUCKET).remove([expense.file_path]);
    }

    const { error } = await supabase.from("expenses").delete().eq("id", expense.id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setNotice("Expense deleted successfully.");
    await loadExpenses();
  }

  async function openFile(expense: Expense) {
    if (expense.file_url) {
      window.open(expense.file_url, "_blank", "noopener,noreferrer");
      return;
    }

    if (!expense.file_path) {
      alert("No file attached to this expense.");
      return;
    }

    const { data, error } = await supabase.storage
      .from(EXPENSE_BUCKET)
      .createSignedUrl(expense.file_path, 300);

    if (error || !data?.signedUrl) {
      alert(error?.message || "Could not open file.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredExpenses = useMemo(() => {
    const term = search.toLowerCase();

    return expenses.filter((expense) => {
      const matchesCategory =
        selectedCategory === "all" || expense.category === selectedCategory;

      const matchesSearch =
        expense.vendor?.toLowerCase().includes(term) ||
        expense.category?.toLowerCase().includes(term) ||
        expense.payment_method?.toLowerCase().includes(term) ||
        expense.expense_type?.toLowerCase().includes(term) ||
        expense.description?.toLowerCase().includes(term) ||
        expense.status?.toLowerCase().includes(term) ||
        expense.file_name?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [expenses, search, selectedCategory]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const visibleTotal = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );
  }, [filteredExpenses]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter((expense) => {
        if (!expense.expense_date) return false;

        const date = new Date(`${expense.expense_date}T00:00:00`);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

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
        <CamvelleEyebrow>Expense Management</CamvelleEyebrow>

        <CamvelleHeading>
          Expense
          <br />
          Records
        </CamvelleHeading>

        <CamvelleBody>
          Upload receipts and invoices, track business spending, and keep expense
          records connected to your finance workflow.
        </CamvelleBody>

        <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/finance" className={camvelleCreamButton}>
            Open Finance
          </Link>

          <Link href="/dashboard" className={camvelleGhostButton}>
            Dashboard
          </Link>
        </div>

        <div className="mx-auto mt-8 w-full max-w-xl text-left">
          <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
            Navigate
          </label>

          <select
            defaultValue="expenses"
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
            <option value="expenses" className="bg-black">
              Expenses
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
          title="Total Expenses"
          value={loading ? "..." : formatMoney(totalExpenses)}
          icon={<Wallet size={18} />}
        />

        <StatCard
          title="This Month"
          value={loading ? "..." : formatMoney(thisMonthTotal)}
          icon={<CalendarDays size={18} />}
        />

        <StatCard
          title="Visible Total"
          value={loading ? "..." : formatMoney(visibleTotal)}
          icon={<Search size={18} />}
        />

        <StatCard
          title="Records"
          value={loading ? "..." : String(expenses.length)}
          icon={<ReceiptText size={18} />}
        />
      </div>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Upload Expense</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Add receipt
              <br />
              or invoice.
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50">
            <Upload size={18} />
          </div>
        </div>

        {notice && (
          <div className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-100">
            {notice}
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <InputBubble
            label="Expense Date"
            type="date"
            value={form.expense_date}
            onChange={(value) => setForm({ ...form, expense_date: value })}
          />

          <InputBubble
            label="Vendor"
            value={form.vendor}
            onChange={(value) => setForm({ ...form, vendor: value })}
            placeholder="Vendor or store name"
          />

          <InputBubble
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(value) => setForm({ ...form, amount: value })}
            placeholder="0.00"
          />

          <SelectBubble
            label="Category"
            value={form.category}
            options={categories}
            onChange={(value) => setForm({ ...form, category: value })}
          />

          <SelectBubble
            label="Payment Method"
            value={form.payment_method}
            options={paymentMethods}
            onChange={(value) => setForm({ ...form, payment_method: value })}
          />

          <SelectBubble
            label="File Type"
            value={form.expense_type}
            options={["Receipt", "Invoice", "Estimate", "Other"]}
            onChange={(value) => setForm({ ...form, expense_type: value })}
          />

          <SelectBubble
            label="Status"
            value={form.status}
            options={["Recorded", "Paid", "Reimbursable", "Archived"]}
            onChange={(value) => setForm({ ...form, status: value })}
          />

          <CamvelleInnerPanel className="p-5">
            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
              Receipt / Invoice File
            </label>

            <input
              id="expense-receipts"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-[#f5f0e7] file:px-5 file:py-3 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.25em] file:text-black"
            />

            {selectedFile && (
              <p className="mt-3 text-xs leading-6 text-white/40">
                Selected: {selectedFile.name}
              </p>
            )}
          </CamvelleInnerPanel>

          <CamvelleInnerPanel className="p-5 md:col-span-2">
            <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
              Notes
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional expense details..."
              className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </CamvelleInnerPanel>
        </div>

        <button
          type="button"
          onClick={createExpense}
          disabled={uploading}
          className={`mt-6 w-full ${camvelleCreamButton} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {uploading ? "Saving Expense..." : "Save Expense"}
        </button>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 sm:p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <CamvelleEyebrow>Expense Library</CamvelleEyebrow>

            <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
              Receipts
              <br />
              and invoices.
            </h2>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-black/20 px-6 py-4">
            <Search size={16} className="text-white/35" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 ${
              selectedCategory === "all" ? camvelleCreamButton : camvelleGhostButton
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 ${
                selectedCategory === category
                  ? camvelleCreamButton
                  : camvelleGhostButton
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && <p className="mt-10 text-white/50">Loading expenses...</p>}

        {!loading && filteredExpenses.length === 0 && (
          <CamvelleInnerPanel className="mt-10 p-7 text-white/50">
            No expenses found.
          </CamvelleInnerPanel>
        )}

        <div className="mt-10 grid gap-4">
          {filteredExpenses.map((expense, index) => {
            const isEditing = editingId === expense.id;

            return (
              <CamvelleInnerPanel
                key={expense.id}
                className="mx-auto w-full max-w-4xl p-5 md:p-6"
              >
                {!isEditing && (
                  <>
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                          {String(index + 1).padStart(2, "0")} / Expense
                        </p>

                        <h3 className="mt-3 text-3xl font-light tracking-[-0.06em] text-white md:text-4xl">
                          {expense.vendor || "Unnamed Expense"}
                        </h3>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <CamvelleStatusPill status={expense.category || "Other"} />
                          <CamvelleStatusPill status={expense.expense_type || "Receipt"} />
                          <CamvelleStatusPill status={expense.status || "Recorded"} />
                        </div>
                      </div>

                      <p className="text-4xl font-light tracking-[-0.06em] text-white">
                        {formatMoney(Number(expense.amount || 0))}
                      </p>
                    </div>

                    <div className="mt-6 grid gap-4 text-sm leading-7 text-white/55 md:grid-cols-2">
                      <DetailLine label="Date" value={expense.expense_date} />
                      <DetailLine label="Payment" value={expense.payment_method} />
                      <DetailLine label="File" value={expense.file_name || "No file attached"} />
                      <DetailLine label="Updated" value={formatDateTime(expense.updated_at)} />
                    </div>

                    {expense.description && (
                      <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-white/50">
                        {expense.description}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <IconButton
                        label="Edit"
                        icon={<Pencil size={16} />}
                        onClick={() => startEdit(expense)}
                      />

                      <IconButton
                        label={deletingId === expense.id ? "Deleting" : "Delete"}
                        icon={<Trash2 size={16} />}
                        onClick={() => deleteExpense(expense)}
                        disabled={deletingId === expense.id}
                        danger
                      />

                      {(expense.file_path || expense.file_url) && (
                        <button
                          type="button"
                          onClick={() => openFile(expense)}
                          className={camvelleGhostButton}
                        >
                          Open File
                        </button>
                      )}
                    </div>
                  </>
                )}

                {isEditing && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <InputBubble
                        label="Expense Date"
                        type="date"
                        value={editForm.expense_date}
                        onChange={(value) =>
                          setEditForm({ ...editForm, expense_date: value })
                        }
                      />

                      <InputBubble
                        label="Vendor"
                        value={editForm.vendor}
                        onChange={(value) =>
                          setEditForm({ ...editForm, vendor: value })
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

                      <SelectBubble
                        label="Category"
                        value={editForm.category}
                        options={categories}
                        onChange={(value) =>
                          setEditForm({ ...editForm, category: value })
                        }
                      />

                      <SelectBubble
                        label="Payment Method"
                        value={editForm.payment_method}
                        options={paymentMethods}
                        onChange={(value) =>
                          setEditForm({ ...editForm, payment_method: value })
                        }
                      />

                      <SelectBubble
                        label="File Type"
                        value={editForm.expense_type}
                        options={["Receipt", "Invoice", "Estimate", "Other"]}
                        onChange={(value) =>
                          setEditForm({ ...editForm, expense_type: value })
                        }
                      />

                      <SelectBubble
                        label="Status"
                        value={editForm.status}
                        options={["Recorded", "Paid", "Reimbursable", "Archived"]}
                        onChange={(value) =>
                          setEditForm({ ...editForm, status: value })
                        }
                      />

                      <CamvelleInnerPanel className="p-5 md:col-span-2">
                        <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
                          Notes
                        </label>

                        <textarea
                          rows={4}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/25"
                        />
                      </CamvelleInnerPanel>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <IconButton
                        label={savingId === expense.id ? "Saving" : "Save"}
                        icon={<Save size={16} />}
                        onClick={() => saveExpense(expense.id)}
                        disabled={savingId === expense.id}
                      />

                      <IconButton
                        label="Cancel"
                        icon={<X size={16} />}
                        onClick={() => setEditingId(null)}
                      />
                    </div>
                  </>
                )}
              </CamvelleInnerPanel>
            );
          })}
        </div>
      </CamvellePanel>
    </CamvellePageShell>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
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
    </CamvellePanel>
  );
}

function InputBubble({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
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

function SelectBubble({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <CamvelleInnerPanel className="p-5">
      <label className="mb-3 block text-[10px] uppercase tracking-[0.35em] text-white/35">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-black">
            {option}
          </option>
        ))}
      </select>
    </CamvelleInnerPanel>
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
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          : "border-white/10 bg-black/20 text-white/65 hover:bg-[#f5f0e7] hover:text-black"
      }`}
    >
      {icon}
    </button>
  );
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
