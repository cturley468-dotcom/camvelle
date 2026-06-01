"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock3,
  FileSignature,
  GalleryVerticalEnd,
  Inbox,
  LayoutGrid,
  LogOut,
  ReceiptText,
  Send,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  { label: "Invoices", value: "invoices" },
  { label: "Contracts", value: "contracts" },
  { label: "Galleries", value: "galleries" },
  { label: "Finance", value: "finance" },
];

export default function DashboardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setNotice("");

    const [
      inquiryResult,
      clientResult,
      invoiceResult,
      contractResult,
    ] = await Promise.all([
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

    if (inquiryResult.error) {
      console.warn(inquiryResult.error.message);
    }

    if (clientResult.error) {
      console.warn(clientResult.error.message);
    }

    if (invoiceResult.error) {
      console.warn(invoiceResult.error.message);
    }

    if (contractResult.error) {
      console.warn(contractResult.error.message);
    }

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
        <Link href="/" className="flex items-center">
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
          className="group flex items-center gap-3 rounded-full border border-white/10 bg-[#f5f0e7] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-black transition hover:scale-[1.02]"
        >
          <LogOut size={15} />
          Logout
        </button>
      </header>

      <section className="relative z-10 px-4 pb-24 pt-4 md:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-center shadow-[0_0_90px_rgba(255,255,255,.07)] backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-14">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              Camvelle Studio HQ
            </p>

            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Studio
              <br />
              Dashboard.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/50">
              Business operations, client records, bookings, contracts, invoices,
              galleries, and financial movement in one clean command center.
            </p>

            <div className="mx-auto mt-12 grid max-w-4xl gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div className="text-left">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.35em] text-white/35">
                  Navigate
                </label>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      window.location.href = `/dashboard/${e.target.value}`;
                    }
                  }}
                  className="w-full rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-white outline-none backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
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
              </div>

              <Link
                href="/dashboard/clients"
                className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 transition hover:bg-white hover:text-black"
              >
                Clients
              </Link>

              <Link
                href="/dashboard/bookings"
                className="rounded-full bg-[#f5f0e7] px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-white"
              >
                Bookings
              </Link>
            </div>
          </div>

          {notice && (
            <div className="mx-auto mt-6 w-full max-w-3xl rounded-[2rem] border border-green-400/20 bg-green-500/10 p-5 text-center text-sm text-green-100">
              {notice}
            </div>
          )}

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
              title="Signed Contracts"
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
              description="Manage client records, emails, session notes, invoices, contracts, and activity history."
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
              href="/dashboard"
              title="Operations"
              value="HQ"
              description="A quick view of Camvelle’s business flow and recent movement."
              icon={<LayoutGrid size={18} />}
            />
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 shadow-[0_0_90px_rgba(255,255,255,.07)] backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                    Calendar
                  </p>

                  <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                    Next 30 days.
                  </h2>
                </div>

                <Link
                  href="/dashboard/calendar"
                  className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/65 transition hover:bg-white hover:text-black"
                >
                  Open Calendar
                  <ArrowUpRight size={15} />
                </Link>
              </div>

              <MiniCalendar upcomingDates={upcomingDates} />
            </div>

            <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 shadow-[0_0_90px_rgba(255,255,255,.07)] backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
              <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
                Activity
              </p>

              <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
                Recent movement.
              </h2>

              {activity.length === 0 ? (
                <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/55 p-6 text-white/50">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="mt-10 grid gap-3">
                  {activity.map((item) => (
                    <ActivityCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 shadow-[0_0_90px_rgba(255,255,255,.07)] backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05] md:p-12">
            <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
              System Status
            </p>

            <h2 className="mt-6 text-5xl font-light tracking-[-0.07em] md:text-6xl">
              Workflow health.
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <SystemStatusCard
                title="Client Files"
                status="Active"
                detail="Client records are connected to invoices and contracts."
              />

              <SystemStatusCard
                title="Email Flow"
                status="Active"
                detail="Invoices, contracts, and signed copies route through Camvelle email."
              />

              <SystemStatusCard
                title="PDF Flow"
                status="Active"
                detail="Invoice and signed contract PDFs are generated through the app."
              />
            </div>
          </div>
        </div>
      </section>
    </main>
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
    <div className="rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 shadow-[0_0_90px_rgba(255,255,255,.07)] backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white/[0.05]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/55">
          {icon}
        </div>
      </div>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">{value}</h3>

      <p className="mt-4 text-sm leading-6 text-white/40">{detail}</p>
    </div>
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
      className="group rounded-[3rem] border border-white/10 bg-white/[0.035] p-7 shadow-[0_0_90px_rgba(255,255,255,.07)] backdrop-blur-xl transition duration-500 hover:border-white/20 hover:bg-white hover:text-black"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35 transition group-hover:text-black/45">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/55 transition group-hover:border-black/10 group-hover:bg-black/5 group-hover:text-black">
          {icon}
        </div>
      </div>

      <h3 className="mt-6 text-4xl font-light tracking-[-0.06em]">{value}</h3>

      <p className="mt-5 leading-7 text-white/50 transition group-hover:text-black/55">
        {description}
      </p>

      <div className="mt-7 inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45 transition group-hover:text-black/50">
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
            className={`rounded-2xl border p-4 text-center backdrop-blur-xl transition ${
              hasEvent
                ? "border-green-400/25 bg-green-500/10"
                : isToday
                  ? "border-white/20 bg-white/[0.07]"
                  : "border-white/10 bg-white/[0.035]"
            }`}
          >
            <p className="text-xs text-white/40">
              {day.toLocaleDateString("en-US", {
                month: "short",
              })}
            </p>

            <p className="mt-2 text-lg font-light">{day.getDate()}</p>

            {hasEvent && (
              <div className="mx-auto mt-3 h-1.5 w-1.5 rounded-full bg-green-200" />
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
    <div className="rounded-[2rem] border border-white/10 bg-black/55 p-5">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/55">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                {item.type}
              </p>

              <h3 className="mt-2 text-xl font-light tracking-[-0.04em]">
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
    </div>
  );
}

function SystemStatusCard({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/55 p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
          {title}
        </p>

        <span className="rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-green-100">
          {status}
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-white/45">{detail}</p>
    </div>
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
      detail: `${inquiry.full_name || inquiry.email || "A new lead"} submitted an inquiry.`,
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
        detail: `${formatMoney(Number(invoice.amount || 0))} invoice record created.`,
        time: invoice.created_at,
        sortTime: getSortTime(invoice.created_at),
      });
    }

    if (invoice.sent_at) {
      items.push({
        id: `invoice-sent-${invoice.id}`,
        type: "invoice",
        title: `${invoice.invoice_number || "Invoice"} sent`,
        detail: `Invoice sent to ${invoice.client_email || invoice.client_name || "client"}.`,
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
        detail: `Contract created for ${contract.client_name || contract.client_email || "client"}.`,
        time: contract.created_at,
        sortTime: getSortTime(contract.created_at),
      });
    }

    if (contract.sent_at) {
      items.push({
        id: `contract-sent-${contract.id}`,
        type: "contract",
        title: `${title} sent`,
        detail: `Signing link sent to ${contract.client_email || contract.client_name || "client"}.`,
        time: contract.sent_at,
        sortTime: getSortTime(contract.sent_at),
      });
    }

    if (contract.signed_at) {
      items.push({
        id: `contract-signed-${contract.id}`,
        type: "contract",
        title: `${title} signed`,
        detail: `Signed by ${contract.client_name || contract.client_email || "client"}.`,
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
