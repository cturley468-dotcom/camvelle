import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function GET(
  request: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await context.params;

  if (!invoiceId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://camvelle.com"}/payment/cancel`
    );
  }

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://camvelle.com"}/payment/cancel`
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://camvelle.com";
  const amountCents = Math.round(Number(invoice.amount || 0) * 100);

  if (String(invoice.status || "").toLowerCase() === "paid") {
    return NextResponse.redirect(`${siteUrl}/payment/success?already_paid=true`);
  }

  if (!amountCents || amountCents <= 0) {
    return NextResponse.redirect(`${siteUrl}/payment/cancel?invalid_amount=true`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: invoice.client_email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Camvelle Invoice ${invoice.invoice_number || ""}`.trim(),
            description: invoice.client_name
              ? `Invoice for ${invoice.client_name}`
              : "Camvelle Creative invoice",
          },
        },
      },
    ],
    metadata: {
      invoiceId: invoice.id,
      clientId: invoice.client_id || "",
    },
    success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/payment/cancel?invoice=${invoice.id}`,
  });

  if (!session.url) {
    return NextResponse.redirect(`${siteUrl}/payment/cancel?checkout_failed=true`);
  }

  return NextResponse.redirect(session.url, 303);
}
