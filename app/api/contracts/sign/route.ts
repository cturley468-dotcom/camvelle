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

function makeFileName(value: unknown) {
  return (
    clean(value, "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "client"
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
  const ownerEmail = process.env.CAMVELLE_OWNER_EMAIL;

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  const clientEmail = clean(contract.client_email);
  const clientName = clean(contract.client_name, "there");
  const contractTitle = clean(
    contract.title || contract.contract_type,
    "Photography Agreement"
  );

  if (!clientEmail) {
    throw new Error("This contract does not have a client email.");
  }

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

  const recipients = ownerEmail
    ? Array.from(new Set([clientEmail, ownerEmail]))
    : [clientEmail];

  const fileName = `${makeFileName(contract.client_name)}-signed-contract.pdf`;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "camvelle-app/1.0",
    },
    body: JSON.stringify({
      from: contractFromEmail,
      to: recipients,
      subject: `Signed ${contractTitle} - Camvelle Creative`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Camvelle Creative</h2>

          <p>Hi ${clientName},</p>

          <p>Your signed contract has been completed and attached for your records.</p>

          <p>
            <strong>Contract:</strong> ${contractTitle}<br />
            <strong>Status:</strong> Signed<br />
            <strong>Signed By:</strong> ${clean(contract.signed_name, clientName)}<br />
            <strong>Signed Date:</strong> ${clean(contract.signed_date, "Not listed")}
          </p>

          <p>
            You can also view the signed PDF here:
            <br />
            <a href="${signedPdfUrl}" style="display:inline-block;margin-top:12px;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:999px;">
              View Signed Contract PDF
            </a>
          </p>

          <p>Thank you for choosing Camvelle Creative.</p>

          <p style="color:#666;font-size:13px;">
            Camvelle.com
          </p>
        </div>
      `,
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
