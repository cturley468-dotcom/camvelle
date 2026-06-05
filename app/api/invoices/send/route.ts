import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://camvelle.com";


    const invoiceFromEmail =
      process.env.INVOICE_FROM_EMAIL ||
      "Camvelle Creative <invoices@camvelle.com>";

  

    const replyToEmail =
      process.env.CAMVELLE_REPLY_TO_EMAIL || "cam@camvelle.com";

    const ownerEmail = process.env.CAMVELLE_OWNER_EMAIL;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL." },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId." }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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

    const paymentUrl = `${siteUrl}/api/stripe/invoice-checkout/${invoice.id}`;
    const clientEmail = clean(invoice.client_email);
    const clientName = clean(invoice.client_name, "there");
    const invoiceNumber = clean(invoice.invoice_number, "Invoice");
    const amount = formatMoney(Number(invoice.amount || 0));
    const dueDate = clean(invoice.due_date, "Not listed");
    const invoicePdfUrl = clean(invoice.invoice_pdf_url);

    if (!clientEmail) {
      return NextResponse.json(
        { error: "This invoice does not have a client email." },
        { status: 400 }
      );
    }

    if (!invoicePdfUrl) {
      return NextResponse.json(
        { error: "Generate the invoice PDF before sending." },
        { status: 400 }
      );
    }

    const bcc =
      ownerEmail &&
      ownerEmail.toLowerCase().trim() !== clientEmail.toLowerCase().trim()
        ? [ownerEmail]
        : undefined;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "camvelle-app/1.0",
      },
      body: JSON.stringify({
        from: invoiceFromEmail,
        reply_to: replyToEmail,
        to: [clientEmail],
        bcc,
        subject: `Invoice ${invoiceNumber} from Camvelle Creative`,
        html: `
          <div style="margin:0;padding:0;background:#f7f4ef;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              Your Camvelle Creative invoice is ready.
            </div>

            <div style="max-width:640px;margin:0 auto;padding:32px 18px;font-family:Arial,Helvetica,sans-serif;color:#151515;">
              <div style="background:#ffffff;border:1px solid #e8e2d8;border-radius:28px;padding:34px;">
                <p style="margin:0 0 10px 0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#777;">
                  Camvelle Creative
                </p>

                <h1 style="margin:0 0 26px 0;font-size:34px;line-height:1.05;font-weight:500;letter-spacing:-1px;">
                  Invoice Ready
                </h1>

                <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
                  Hi ${escapeHtml(clientName)},
                </p>

                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.7;color:#333;">
                  Your invoice from Camvelle Creative is ready for review.
                </p>

                <div style="border:1px solid #eee6dc;border-radius:22px;padding:22px;margin:0 0 26px 0;background:#fbfaf8;">
                  <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;">
                    <strong>Invoice:</strong> ${escapeHtml(invoiceNumber)}
                  </p>

                  <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;">
                    <strong>Amount Due:</strong> ${escapeHtml(amount)}
                  </p>

                  <p style="margin:0;font-size:14px;line-height:1.6;">
                    <strong>Due Date:</strong> ${escapeHtml(dueDate)}
                  </p>
                </div>
               
                <p style="margin:28px 0 14px 0;">
  <a
    href="${escapeHtml(paymentUrl)}"
    style="
      display:inline-block;
      padding:18px 34px;
      border-radius:999px;
      background:#f5f0e7;
      color:#050505;
      text-decoration:none;
      font-size:12px;
      font-weight:700;
      letter-spacing:0.28em;
      text-transform:uppercase;
    "
  >
    Pay Invoice
  </a>
</p>

<p style="margin:14px 0 28px 0;">
  <a
    href="${escapeHtml(invoicePdfUrl)}"
    style="
      display:inline-block;
      padding:18px 34px;
      border-radius:999px;
      background:#050505;
      color:#f5f0e7;
      text-decoration:none;
      font-size:12px;
      font-weight:700;
      letter-spacing:0.28em;
      text-transform:uppercase;
      border:1px solid rgba(245,240,231,0.18);
    "
  >
    View Invoice PDF
  </a>
</p>


                <p style="margin:0 0 28px 0;">
                  <a href="${escapeHtml(invoicePdfUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:15px 24px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                    View Invoice PDF
                  </a>
                </p>

                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:#333;">
                  Thank you for choosing Camvelle Creative.
                </p>

                <p style="margin:0;font-size:13px;color:#777;">
                  Camvelle.com
                </p>
              </div>

              <p style="margin:18px 0 0 0;text-align:center;font-size:12px;color:#999;">
                Replies go directly to Camvelle Creative.
              </p>
            </div>
          </div>
        `,
        text: `Hi ${clientName},

Your invoice from Camvelle Creative is ready.

Invoice: ${invoiceNumber}
Amount Due: ${amount}
Due Date: ${dueDate}

View Invoice PDF:
${invoicePdfUrl}

Thank you for choosing Camvelle Creative.

Camvelle.com`,
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
      emailId: emailResult?.id || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
