import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type AnyRow = Record<string, any>;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

  return createClient(supabaseUrl, serviceRoleKey);
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function formatDate(value: unknown) {
  const text = clean(value);

  if (!text) return "Not listed";

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dateValue(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];

    if (value) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

function latest(rows: AnyRow[]) {
  if (!rows.length) return null;

  return [...rows].sort((a, b) => {
    const aDate =
      dateValue(a, ["updated_at", "signed_at", "sent_at", "sent_date", "created_at"])?.getTime() || 0;

    const bDate =
      dateValue(b, ["updated_at", "signed_at", "sent_at", "sent_date", "created_at"])?.getTime() || 0;

    return bDate - aDate;
  })[0];
}

function rowMatchesEmail(row: AnyRow, email: string) {
  const possibleEmails = [
    row.email,
    row.client_email,
    row.customer_email,
    row.signed_email,
  ];

  return possibleEmails.some((value) => lower(value) === email);
}

function getContractStatus(contract: AnyRow | null) {
  if (!contract) return "Not Sent";

  const status = lower(contract.status);

  if (status === "signed" || contract.signed_at || contract.signed_date) {
    return "Signed";
  }

  if (
    status === "sent" ||
    status === "ready_to_sign" ||
    contract.sent_at ||
    contract.sent_date ||
    contract.signing_token
  ) {
    return "Sent";
  }

  return "Not Sent";
}

function getInvoiceStatus(invoice: AnyRow | null) {
  if (!invoice) return "Not Sent";

  const status = lower(invoice.status);

  if (status === "paid" || invoice.paid_at || Number(invoice.balance_due) === 0) {
    return "Paid";
  }

  if (
    status === "sent" ||
    status === "viewed" ||
    status === "overdue" ||
    invoice.sent_at ||
    invoice.sent_date
  ) {
    return "Sent";
  }

  if (status === "draft") {
    return "Draft";
  }

  return "Not Sent";
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    const email = lower(body.email);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const [inquiriesResult, contractsResult, invoicesResult] = await Promise.all([
      supabaseAdmin.from("inquiries").select("*").limit(500),
      supabaseAdmin.from("contracts").select("*").limit(500),
      supabaseAdmin.from("invoices").select("*").limit(500),
    ]);

    const inquiries = inquiriesResult.data || [];
    const contracts = contractsResult.data || [];
    const invoices = invoicesResult.data || [];

    const matchingInquiries = inquiries.filter((row) => rowMatchesEmail(row, email));
    const matchingContracts = contracts.filter((row) => rowMatchesEmail(row, email));
    const matchingInvoices = invoices.filter((row) => rowMatchesEmail(row, email));

    const latestInquiry = latest(matchingInquiries);
    const latestContract = latest(matchingContracts);
    const latestInvoice = latest(matchingInvoices);

    const found =
      Boolean(latestInquiry) || Boolean(latestContract) || Boolean(latestInvoice);

    if (!found) {
      return NextResponse.json({
        found: false,
        message:
          "No booking status was found for that email. Please check the email address or contact Camvelle Creative.",
      });
    }

    const clientName =
      clean(latestContract?.client_name) ||
      clean(latestInvoice?.client_name) ||
      clean(latestInvoice?.customer_name) ||
      clean(latestInquiry?.full_name) ||
      "Client";

    const sessionType =
      clean(latestContract?.contract_type) ||
      clean(latestContract?.title) ||
      clean(latestInquiry?.service_type) ||
      "Photography Session";

    const bookingStatus = latestInquiry ? "Received" : "Not Found";
    const contractStatus = getContractStatus(latestContract);
    const invoiceStatus = getInvoiceStatus(latestInvoice);

    const lastUpdated =
      dateValue(latestContract || {}, [
        "signed_at",
        "sent_at",
        "sent_date",
        "updated_at",
        "created_at",
      ]) ||
      dateValue(latestInvoice || {}, [
        "paid_at",
        "sent_at",
        "sent_date",
        "updated_at",
        "created_at",
      ]) ||
      dateValue(latestInquiry || {}, ["updated_at", "created_at"]);

    return NextResponse.json({
      found: true,
      clientName,
      sessionType,
      bookingStatus,
      contractStatus,
      invoiceStatus,
      lastUpdated: formatDate(lastUpdated),
      message: "Status found.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
