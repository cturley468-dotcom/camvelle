"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle,
  FileSignature,
  GalleryVerticalEnd,
  Inbox,
  LogOut,
  ReceiptText,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  CamvelleBody,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleInnerPanel,
  CamvellePageShell,
  CamvellePanel,
  camvelleCreamButton,
  camvelleGhostButton,
  camvelleInnerPanel,
} from "../components/CamvelleUI";

type Inquiry = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  created_at?: string | null;
};

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  notes: string | null;
  created_at: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
  client_name: string | null;
  client_email: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string | null;
};

type Contract = {
  id: string;
  contract_type: string | null;
  status: string | null;
  client_name: string | null;
  client_email: string | null;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string | null;
};

type ActivityItem = {
  id: string;
  type: "client" | "invoice" | "contract" | "inquiry";
  title: string;
  detail: string;
  time: string | null;
  sortTime: number;
};

const sections = [
  { label: "Clients", value: "clients" },
  { label: "Bookings", value: "bookings" },
  { label: "Calendar", value: "calendar" },
  { label: "Galleries", value: "galleries" },
  { label: "Finance", value: "finance" },
];

export default function DashboardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const [inquiryResult, clientResult, invoiceResult, contractResult] =
      await Promise.all([
        supabase
          .from("inquiries")
          .select("id, full_name, email, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("clients")
          .select("id, full_name, email, notes, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select(
            "id, invoice_number, amount, status, due_date, client_name, client_email, sent_at, paid_at, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("contracts")
          .select(
            "id, contract_type, status, client_name, client_email, sent_at, signed_at, created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

    setInquiries(inquiryResult.data || []);
    setClients(clientResult.data || []);
    setInvoices(invoiceResult.data || []);
    setContracts(contractResult.data || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const estimatedRevenue = useMemo(() => {
    return inquiries.length * 400;
  }, [inquiries.length]);

  const invoiceTotal = useMemo(() => {
    return invoices.reduce((sum, invoice) => {
      return sum + Number(invoice.amount || 0);
    }, 0);
  }, [invoices]);

  const outstandingTotal = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status !== "paid")
      .reduce((sum, invoice) => {
        return sum + Number(invoice.amount || 0);
      }, 0);
  }, [invoices]);

  const openInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status !== "paid").length;
  }, [invoices]);

  const signedContracts = useMemo(() => {
    return contracts.filter((contract) => contract.status === "signed").length;
  }, [contracts]);

  const scheduledClients = useMemo(() => {
    return clients.filter((client) => getScheduledDate(client.notes)).length;
  }, [clients]);

  const activity = useMemo(() => {
    return buildActivity(inquiries, clients, invoices, contracts);
  }, [inquiries, clients, invoices, contracts]);

  const upcomingDates = useMemo(() => {
    return buildUpcomingDates(clients);
  }, [clients]);

  return (
    <CamvellePageShell>
      <header className="relative z-[9999] mb-10 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/branding/camvelle-logo.png"
            alt="Camvelle Creative"
            width={420}
            height={120}
            priority
            unoptimized
            className="h-14 w-auto object-contain sm:h-16 md:h-20"
          />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={`${camvelleCreamButton} inline-flex items-center gap-3`}
        >
          <LogOut size={15} />
          Logout
        </button>
      </header>

      <CamvellePanel className="p-8 text-center sm:p-10 md:p-14">
        <CamvelleEyebrow>Camvelle Studio HQ</CamvelleEyebrow>

        <CamvelleHeading>
          Studio
          <br />
          Dashboard
        </CamvelleHeading>

        <CamvelleBody>Business operations overview.</CamvelleBody>

        <div className="mx-auto mt-12 max-w-3xl">
          <label className="mb-3 block text-left text-[11px] uppercase tracking-[0.35em] text-white/35">
            Navigate
          </label>

          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                window.location.href = `/dashboard/${e.target.value}`;
              }
            }}
            className="w-full rounded-full border border-white/10 bg-black/45 px-6 py-5 text-[11px] uppercase tracking-[0.32em] text-white outline-none backdrop-blur-xl transition hover:border-white/20"
          >
            <option value="" className="bg-black">
              Select Page
            </option>

            {sections.map((section) => (
              <option
                key={section.value}
                value={section.value}
                className="bg-black"
              >
                {section.label}
              </option>
            ))}
          </select>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/clients" className={camvelleGhostButton}>
              Clients
            </Link>

            <Link href="/dashboard/bookings" className={camvelleGhostButton}>
              Bookings
            </Link>
          </div>
        </div>
      </CamvellePanel>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Inquiries"
          value={loading ? "..." : String(inquiries.length)}
          detail="Incoming booking interest"
          icon={<Inbox size={18} />}
        />

        <StatCard
          title="Clients"
          value={loading ? "..." : String(clients.length)}
          detail="Saved client files"
          icon={<Users size={18} />}
        />

        <StatCard
          title="Outstanding"
          value={loading ? "..." : formatMoney(outstandingTotal)}
          detail="Unpaid invoice balance"
          icon={<Wallet size={18} />}
        />

        <StatCard
          title="Signed"
          value={loading ? "..." : String(signedContracts)}
          detail="Completed agreements"
          icon={<CheckCircle size={18} />}
        />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          href="/dashboard/clients"
          title="Clients"
          value={String(clients.length)}
          description="Manage client records, session notes, invoices, contracts, and photo delivery progress."
          icon={<Users size={18} />}
        />

        <DashboardCard
          href="/dashboard/bookings"
          title="Bookings"
          value={String(inquiries.length)}
          description="Review incoming inquiries and move leads toward confirmed sessions."
          icon={<Inbox size={18} />}
        />

        <DashboardCard
          href="/dashboard/calendar"
          title="Calendar"
          value={`${scheduledClients}`}
          description="Track scheduled clients and upcoming session dates."
          icon={<Calendar size={18} />}
        />

        <DashboardCard
          href="/dashboard/invoices"
          title="Invoices"
          value={formatMoney(invoiceTotal)}
          description={`${openInvoices} open invoice${
            openInvoices === 1 ? "" : "s"
          } currently tracked.`}
          icon={<ReceiptText size={18} />}
        />

        <DashboardCard
          href="/dashboard/contracts"
          title="Contracts"
          value={`${signedContracts}/${contracts.length}`}
          description="Send agreements, monitor signatures, and access signed PDFs."
          icon={<FileSignature size={18} />}
        />

        <DashboardCard
          href="/dashboard/galleries"
          title="Galleries"
          value="Manage"
          description="Upload, organize, and prepare gallery content for delivery."
          icon={<GalleryVerticalEnd size={18} />}
        />

        <DashboardCard
          href="/dashboard/finance"
          title="Finance"
          value={formatMoney(estimatedRevenue)}
          description="Estimate future revenue and review business performance."
          icon={<Wallet size={18} />}
        />

        <DashboardCard
          href="/dashboard/calendar"
          title="Schedule"
          value="30 Days"
          description="A clean look at upcoming calendar movement."
          icon={<Calendar size={18} />}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <CamvellePanel className="p-7 md:p-12">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <CamvelleEyebrow>Calendar</CamvelleEyebrow>

              <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] text-white md:text-6xl">
                Next 30 days.
              </h2>
            </div>

            <Link
              href="/dashboard/calendar"
              className={`${camvelleGhostButton} inline-flex items-center gap-3`}
            >
              Open Calendar
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <MiniCalendar upcomingDates={upcomingDates} />
        </CamvellePanel>

        <CamvellePanel className="p-7 md:p-12">
          <CamvelleEyebrow>Activity</CamvelleEyebrow>

          <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] text-white md:text-6xl">
            Recent movement.
          </h2>

          {activity.length === 0 ? (
            <CamvelleInnerPanel className="mt-10 p-6 text-white/50">
              No activity recorded yet.
            </CamvelleInnerPanel>
          ) : (
            <div className="mt-10 grid gap-3">
              {activity.map((item) => (
                <ActivityCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </CamvellePanel>
      </div>
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
    <CamvelleInnerPanel className="p-7 transition hover:border-white/20 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/50">
          {icon}
        </div>
      </div>

      <h3 className="mt-7 text-5xl font-light tracking-[-0.07em] text-white">
        {value}
      </h3>

      <p className="mt-5 text-sm leading-6 text-white/40">{detail}</p>
    </CamvelleInnerPanel>
  );
}

function DashboardCard({
  href,
  title,
  value,
  description,
  icon,
}: {
  href: string;
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group block ${camvelleInnerPanel} p-7 transition hover:border-white/20 hover:bg-[#f5f0e7] hover:text-black`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35 transition group-hover:text-black/45">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/50 transition group-hover:border-black/10 group-hover:bg-black/5 group-hover:text-black">
          {icon}
        </div>
      </div>

      <h3 className="mt-7 text-4xl font-light tracking-[-0.06em]">{value}</h3>

      <p className="mt-5 leading-7 text-white/45 transition group-hover:text-black/55">
        {description}
      </p>

      <div className="mt-7 inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40 transition group-hover:text-black/50">
        Open
        <ArrowUpRight size={14} />
      </div>
    </Link>
  );
}

function MiniCalendar({ upcomingDates }: { upcomingDates: Set<string> }) {
  const today = new Date();

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() + i);
    return date;
  });

  return (
    <div className="mt-10 grid grid-cols-5 gap-3 md:grid-cols-10">
      {days.map((day, index) => {
        const iso = toDateInputValue(day);
        const hasEvent = upcomingDates.has(iso);
        const isToday = index === 0;

        return (
          <div
            key={iso}
            className={`rounded-2xl border p-4 text-center backdrop-blur-sm transition ${
              hasEvent
                ? "border-emerald-400/25 bg-emerald-500/10"
                : isToday
                  ? "border-white/20 bg-white/[0.07]"
                  : "border-white/10 bg-black/35"
            }`}
          >
            <p className="text-xs text-white/40">
              {day.toLocaleDateString("en-US", {
                month: "short",
              })}
            </p>

            <p className="mt-2 text-lg font-light text-white">
              {day.getDate()}
            </p>

            {hasEvent && (
              <div className="mx-auto mt-3 h-1.5 w-1.5 rounded-full bg-emerald-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const icon =
    item.type === "invoice" ? (
      <ReceiptText size={16} />
    ) : item.type === "contract" ? (
      <FileSignature size={16} />
    ) : item.type === "inquiry" ? (
      <Inbox size={16} />
    ) : (
      <Users size={16} />
    );

  return (
    <CamvelleInnerPanel className="p-5">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/55">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                {item.type}
              </p>

              <h3 className="mt-2 text-xl font-light tracking-[-0.04em] text-white">
                {item.title}
              </h3>
            </div>

            <p className="shrink-0 text-sm text-white/35">
              {formatDateTime(item.time) || "Date not listed"}
            </p>
          </div>

          <p className="mt-2 text-sm leading-6 text-white/45">{item.detail}</p>
        </div>
      </div>
    </CamvelleInnerPanel>
  );
}

function buildActivity(
  inquiries: Inquiry[],
  clients: Client[],
  invoices: Invoice[],
  contracts: Contract[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  inquiries.forEach((inquiry) => {
    if (!inquiry.created_at) return;

    items.push({
      id: `inquiry-${inquiry.id}`,
      type: "inquiry",
      title: "New inquiry received",
      detail: `${
        inquiry.full_name || inquiry.email || "A new lead"
      } submitted an inquiry.`,
      time: inquiry.created_at,
      sortTime: getSortTime(inquiry.created_at),
    });
  });

  clients.forEach((client) => {
    if (!client.created_at) return;

    items.push({
      id: `client-${client.id}`,
      type: "client",
      title: "Client file created",
      detail: `${client.full_name || "Client"} was added to Camvelle.`,
      time: client.created_at,
      sortTime: getSortTime(client.created_at),
    });
  });

  invoices.forEach((invoice) => {
    if (invoice.created_at) {
      items.push({
        id: `invoice-created-${invoice.id}`,
        type: "invoice",
        title: `${invoice.invoice_number || "Invoice"} created`,
        detail: `${formatMoney(
          Number(invoice.amount || 0)
        )} invoice record created.`,
        time: invoice.created_at,
        sortTime: getSortTime(invoice.created_at),
      });
    }

    if (invoice.sent_at) {
      items.push({
        id: `invoice-sent-${invoice.id}`,
        type: "invoice",
        title: `${invoice.invoice_number || "Invoice"} sent`,
        detail: `Invoice sent to ${
          invoice.client_email || invoice.client_name || "client"
        }.`,
        time: invoice.sent_at,
        sortTime: getSortTime(invoice.sent_at),
      });
    }

    if (invoice.paid_at) {
      items.push({
        id: `invoice-paid-${invoice.id}`,
        type: "invoice",
        title: `${invoice.invoice_number || "Invoice"} paid`,
        detail: `${formatMoney(Number(invoice.amount || 0))} marked paid.`,
        time: invoice.paid_at,
        sortTime: getSortTime(invoice.paid_at),
      });
    }
  });

  contracts.forEach((contract) => {
    const title = contract.contract_type || "Photography Agreement";

    if (contract.created_at) {
      items.push({
        id: `contract-created-${contract.id}`,
        type: "contract",
        title: `${title} created`,
        detail: `Contract created for ${
          contract.client_name || contract.client_email || "client"
        }.`,
        time: contract.created_at,
        sortTime: getSortTime(contract.created_at),
      });
    }

    if (contract.sent_at) {
      items.push({
        id: `contract-sent-${contract.id}`,
        type: "contract",
        title: `${title} sent`,
        detail: `Signing link sent to ${
          contract.client_email || contract.client_name || "client"
        }.`,
        time: contract.sent_at,
        sortTime: getSortTime(contract.sent_at),
      });
    }

    if (contract.signed_at) {
      items.push({
        id: `contract-signed-${contract.id}`,
        type: "contract",
        title: `${title} signed`,
        detail: `Signed by ${
          contract.client_name || contract.client_email || "client"
        }.`,
        time: contract.signed_at,
        sortTime: getSortTime(contract.signed_at),
      });
    }
  });

  return items.sort((a, b) => b.sortTime - a.sortTime).slice(0, 8);
}

function buildUpcomingDates(clients: Client[]) {
  const dates = new Set<string>();

  clients.forEach((client) => {
    const date = getScheduledDate(client.notes);

    if (date) {
      dates.add(date);
    }
  });

  return dates;
}

function getScheduledDate(notes: string | null) {
  if (!notes) return null;

  const match = notes.match(/^Scheduled Date:\s*(\d{4}-\d{2}-\d{2})/im);
  return match?.[1] || null;
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
