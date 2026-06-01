import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

const invoiceFromEmail =
  process.env.INVOICE_FROM_EMAIL ||
  "Camvelle Creative <invoices@camvelle.com>";

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!resendApiKey) throw new Error("Missing RESEND_API_KEY");

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId." }, { status: 400 });
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

    if (!invoice.client_email) {
      return NextResponse.json(
        { error: "This invoice does not have a client email." },
        { status: 400 }
      );
    }

    if (!invoice.invoice_pdf_url) {
      return NextResponse.json(
        { error: "Generate the invoice PDF before sending." },
        { status: 400 }
      );
    }

    const amount = formatMoney(Number(invoice.amount || 0));
    const invoiceNumber = invoice.invoice_number || "Invoice";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent":"camvelle-app/1.0,"
      },
      body: JSON.stringify({
        from: invoiceFromEmail,
        to: [invoice.client_email],
        subject: `Invoice ${invoiceNumber} from Camvelle Creative`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2>Camvelle Creative</h2>

            <p>Hi ${invoice.client_name || "there"},</p>

            <p>Your invoice is ready.</p>

            <p>
              <strong>Invoice:</strong> ${invoiceNumber}<br />
              <strong>Amount:</strong> ${amount}<br />
              <strong>Due Date:</strong> ${invoice.due_date || "Not listed"}
            </p>

            <p>
              <a href="${invoice.invoice_pdf_url}" style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:999px;">
                View Invoice PDF
              </a>
            </p>

            <p>Thank you for choosing Camvelle Creative.</p>

            <p style="color:#666;font-size:13px;">Camvelle.com</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      return NextResponse.json(
        { error: emailResult?.message || "Email could not be sent." },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}
