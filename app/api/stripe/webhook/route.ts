import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function markInvoicePaid({
  invoiceId,
  checkoutSessionId,
  paymentIntentId,
}: {
  invoiceId: string;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
}) {
  if (!invoiceId) {
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const paidAt = new Date().toISOString();

  const updateData: Record<string, string | null> = {
    status: "paid",
    paid_at: paidAt,
    stripe_paid_at: paidAt,
    payment_method: "stripe",
  };

  if (checkoutSessionId) {
    updateData.stripe_checkout_session_id = checkoutSessionId;
  }

  if (paymentIntentId) {
    updateData.stripe_payment_intent_id = paymentIntentId;
  }

  const { error } = await supabaseAdmin
    .from("invoices")
    .update(updateData)
    .eq("id", invoiceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET." },
        { status: 500 }
      );
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid webhook signature.";

      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const invoiceId = session.metadata?.invoice_id || "";

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null;

        await markInvoicePaid({
          invoiceId,
          checkoutSessionId: session.id,
          paymentIntentId,
        });
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = paymentIntent.metadata?.invoice_id || "";

      await markInvoicePaid({
        invoiceId,
        paymentIntentId: paymentIntent.id,
      });
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
