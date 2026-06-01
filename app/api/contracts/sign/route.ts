import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeFileName(value: unknown) {
  return (
    clean(value, "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "client"
  );
}

function uniqueEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      emails
        .map((email) => clean(email).toLowerCase())
        .filter(Boolean)
    )
  );
}

async function sendSignedContractEmail({
  origin,
  token,
  contract,
}: {
  origin: string;
  token: string;
  contract: any;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  const contractFromEmail =
    process.env.CONTRACT_FROM_EMAIL ||
    "Camvelle Creative <contracts@camvelle.com>";

  const replyToEmail =
    process.env.CAMVELLE_REPLY_TO_EMAIL || "cam@camvelle.com";

  const ownerEmail = clean(process.env.CAMVELLE_OWNER_EMAIL);

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  const clientEmail = clean(contract.client_email);
  const signedEmail = clean(contract.signed_email);
  const clientName = clean(contract.client_name, "there");
  const signedName = clean(contract.signed_name, clientName);

  const contractTitle = clean(
    contract.title || contract.contract_type,
    "Photography Agreement"
  );

  const toEmails = uniqueEmails([clientEmail, signedEmail]);

  if (toEmails.length === 0) {
    throw new Error("This contract does not have a client email.");
  }

  const bcc =
    ownerEmail && !toEmails.includes(ownerEmail.toLowerCase())
      ? [ownerEmail]
      : undefined;

  const signedPdfUrl = `${origin}/api/contracts/pdf?token=${encodeURIComponent(
    token
  )}`;

  const pdfResponse = await fetch(signedPdfUrl, {
    cache: "no-store",
  });

  if (!pdfResponse.ok) {
    const text = await pdfResponse.text();

    throw new Error(
      `Signed PDF could not be generated: ${text.slice(0, 160)}`
    );
  }

  const pdfArrayBuffer = await pdfResponse.arrayBuffer();
  const pdfBase64 = Buffer.from(pdfArrayBuffer).toString("base64");

  const fileName = `${makeFileName(contract.client_name)}-signed-contract.pdf`;

  const signedDate = clean(contract.signed_date, "Not listed");

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "camvelle-app/1.0",
    },
    body: JSON.stringify({
      from: contractFromEmail,
      reply_to: replyToEmail,
      to: toEmails,
      bcc,
      subject: `Signed ${contractTitle} - Camvelle Creative`,
      html: `
        <div style="margin:0;padding:0;background:#f7f4ef;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
            Your signed Camvelle Creative contract is complete.
          </div>

          <div style="max-width:640px;margin:0 auto;padding:32px 18px;font-family:Arial,Helvetica,sans-serif;color:#151515;">
            <div style="background:#ffffff;border:1px solid #e8e2d8;border-radius:28px;padding:34px;">
              <p style="margin:0 0 10px 0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#777;">
                Camvelle Creative
              </p>

              <h1 style="margin:0 0 26px 0;font-size:34px;line-height:1.05;font-weight:500;letter-spacing:-1px;">
                Contract Signed
              </h1>

              <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
                Hi ${escapeHtml(clientName)},
              </p>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.7;color:#333;">
                Your contract has been signed and completed. A signed PDF copy is attached for your records.
              </p>

              <div style="border:1px solid #eee6dc;border-radius:22px;padding:22px;margin:0 0 26px 0;background:#fbfaf8;">
                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;">
                  <strong>Contract:</strong> ${escapeHtml(contractTitle)}
                </p>

                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;">
                  <strong>Status:</strong> Signed
                </p>

                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;">
                  <strong>Signed By:</strong> ${escapeHtml(signedName)}
                </p>

                <p style="margin:0;font-size:14px;line-height:1.6;">
                  <strong>Signed Date:</strong> ${escapeHtml(signedDate)}
                </p>
              </div>

              <p style="margin:0 0 28px 0;">
                <a href="${escapeHtml(signedPdfUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:15px 24px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                  View Signed Contract PDF
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

Your contract has been signed and completed. A signed PDF copy is attached for your records.

Contract: ${contractTitle}
Status: Signed
Signed By: ${signedName}
Signed Date: ${signedDate}

View Signed Contract PDF:
${signedPdfUrl}

Thank you for choosing Camvelle Creative.

Camvelle.com`,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    }),
  });

  const emailResult = await emailResponse.json();

  if (!emailResponse.ok) {
    throw new Error(
      emailResult?.message || "Signed contract email could not be sent."
    );
  }

  return {
    resendId: emailResult?.id || null,
    signedPdfUrl,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = String(body.token || "").trim();
    const signedName = String(body.signedName || "").trim();
    const signedEmail = String(body.signedEmail || "").trim();
    const signatureDataUrl = String(body.signatureDataUrl || "").trim();
    const agreed = Boolean(body.agreed);

    if (!token) {
      return NextResponse.json(
        { error: "Missing signing token." },
        { status: 400 }
      );
    }

    if (!signedName) {
      return NextResponse.json(
        { error: "Please type your full name to sign." },
        { status: 400 }
      );
    }

    if (!signedEmail) {
      return NextResponse.json(
        { error: "Please enter your email to sign." },
        { status: 400 }
      );
    }

    if (!agreed) {
      return NextResponse.json(
        { error: "Please confirm that you agree to the contract terms." },
        { status: 400 }
      );
    }

    if (!signatureDataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        { error: "Please draw your signature before submitting." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("signing_token", token)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found." },
        { status: 404 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://camvelle.vercel.app";

    const signedPdfUrl = `${origin}/api/contracts/pdf?token=${encodeURIComponent(
      token
    )}`;

    if (contract.signed_at) {
      return NextResponse.json({
        success: true,
        message: "Contract was already signed.",
        contract: {
          ...contract,
          signed_pdf_url: contract.signed_pdf_url || signedPdfUrl,
        },
      });
    }

    const now = new Date();
    const signedDate = now.toISOString().slice(0, 10);

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";

    const userAgent = request.headers.get("user-agent") || "";

    const { data: updatedContract, error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({
        status: "signed",
        signed_name: signedName,
        signed_email: signedEmail,
        signed_date: signedDate,
        signed_at: now.toISOString(),
        signed_ip: ip,
        signed_user_agent: userAgent,
        signed_pdf_url: signedPdfUrl,
        signed_signature_data_url: signatureDataUrl,
        signed_method: "drawn",
      })
      .eq("id", contract.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    let finalContract = updatedContract;
    let signedEmailSent = false;
    let signedEmailError = "";

    try {
      const emailResult = await sendSignedContractEmail({
        origin,
        token,
        contract: updatedContract,
      });

      signedEmailSent = true;

      const { data: emailedContract } = await supabaseAdmin
        .from("contracts")
        .update({
          signed_pdf_sent_at: new Date().toISOString(),
          signed_pdf_email_id: emailResult.resendId,
          signed_pdf_url: emailResult.signedPdfUrl,
        })
        .eq("id", updatedContract.id)
        .select("*")
        .single();

      if (emailedContract) {
        finalContract = emailedContract;
      }
    } catch (emailError) {
      signedEmailError =
        emailError instanceof Error
          ? emailError.message
          : "Signed contract email could not be sent.";
    }

    return NextResponse.json({
      success: true,
      message: signedEmailSent
        ? "Contract signed successfully. Signed PDF email sent."
        : "Contract signed successfully, but the signed PDF email could not be sent.",
      signedEmailSent,
      signedEmailError,
      contract: finalContract,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
