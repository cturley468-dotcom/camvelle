import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

  return createClient(supabaseUrl, serviceRoleKey);
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(stripeSecretKey);
}

function getOrigin(request: Request) {
  return (
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://camvelle.vercel.app"
  );
}

function getAllowedAdminEmails() {
  return [
    process.env.CAMVELLE_OWNER_EMAIL,
    "cam@camvelle.com",
    "c.turley468@gmail.com",
  ]
    .filter(Boolean)
    .map((email) => String(email).trim().toLowerCase());
}

function moneyToCents(value: unknown) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount)) return 0;

  return Math.round(amount * 100);
}

async function verifyAdmin(request: Request, supabaseAdmin: SupabaseClient) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return {
      ok: false,
      error: "Missing admin session.",
      status: 401,
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  const email = data.user?.email?.toLowerCase() || "";
  const allowedEmails = getAllowedAdminEmails();

  if (error || !allowedEmails.includes(email)) {
    return {
      ok: false,
      error: "Not authorized to create payment links.",
      status: 403,
    };
  }

  return {
    ok: true,
    email,
    status: 200,
  };
}

async function createCheckoutSession({
  request,
  invoiceId,
  requireAdmin,
}: {
  request: Request;
  invoiceId: string;
  requireAdmin: boolean;
}) {
  const supabaseAdmin = getSupabaseAdmin();

  if (requireAdmin) {
    const adminCheck = await verifyAdmin(request, supabaseAdmin);

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
  }

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: invoiceError?.message || "Invoice not found." },
      { status: 404 }
    );
  }

  if (String(invoice.status || "").toLowerCase() === "paid") {
    return NextResponse.json(
      { error: "This invoice is already marked paid." },
      { status: 400 }
    );
  }

  const amountInCents = moneyToCents(invoice.amount);

  if (amountInCents < 50) {
    return NextResponse.json(
      { error: "Invoice amount must be at least $0.50." },
      { status: 400 }
    );
  }

  if (!invoice.client_email) {
    return NextResponse.json(
      { error: "This invoice does not have a client email." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const origin = getOrigin(request);

  const invoiceNumber =
    invoice.invoice_number || `Invoice ${String(invoice.id).slice(0, 8)}`;

  const clientName = invoice.client_name || "Client";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: invoice.client_email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          product_data: {
            name: `Camvelle Creative - ${invoiceNumber}`,
            description: `${clientName} invoice payment`,
          },
        },
      },
    ],
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number || "",
      client_id: invoice.client_id || "",
      client_name: invoice.client_name || "",
      client_email: invoice.client_email || "",
    },
    payment_intent_data: {
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number || "",
        client_id: invoice.client_id || "",
        client_name: invoice.client_name || "",
        client_email: invoice.client_email || "",
      },
    },
   success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://camvelle.com"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://camvelle.com"}/payment/cancel?invoice=${invoice.id}`,
  });

  const { error: updateError } = await supabaseAdmin
    .from("invoices")
    .update({
      stripe_checkout_session_id: checkoutSession.id,
      stripe_payment_url: checkoutSession.url,
      payment_method: "stripe",
    })
    .eq("id", invoice.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    checkoutUrl: checkoutSession.url,
    sessionId: checkoutSession.id,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceId = String(body.invoiceId || "").trim();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId." },
        { status: 400 }
      );
    }

    return await createCheckoutSession({
      request,
      invoiceId,
      requireAdmin: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const invoiceId = String(url.searchParams.get("invoiceId") || "").trim();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId." },
        { status: 400 }
      );
    }

    const response = await createCheckoutSession({
      request,
      invoiceId,
      requireAdmin: false,
    });

    const data = await response.json();

    if (!response.ok || !data.checkoutUrl) {
      return NextResponse.json(
        { error: data.error || "Checkout session could not be created." },
        { status: response.status }
      );
    }

    return NextResponse.redirect(data.checkoutUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
