import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { buildContract } from "../../../lib/contractTemplate";
import type { ContractType } from "../../../lib/contracts";

export const runtime = "nodejs";

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

    const contractFromEmail =
      process.env.CONTRACT_FROM_EMAIL ||
      "Camvelle Creative <contracts@camvelle.com>";

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

    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json(
        { error: "Missing contractId." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: contractError?.message || "Contract not found." },
        { status: 404 }
      );
    }

    let client: any = null;

    if (contract.client_id) {
      const { data: clientData } = await supabaseAdmin
        .from("clients")
        .select("*")
        .eq("id", contract.client_id)
        .single();

      client = clientData;
    }

    const clientName = clean(
      contract.client_name || client?.full_name || client?.name,
      "there"
    );

    const clientEmail = clean(contract.client_email || client?.email);

  const rawContractType = clean(
  contract.contract_type || contract.type || contract.session_type || contract.service_type || contract.title,
  "portrait"
);

const normalizedContractType = rawContractType
  .toLowerCase()
  .trim()
  .replace(/_/g, "-");

let contractType: ContractType = "portrait";

if (normalizedContractType.includes("proposal")) {
  contractType = "proposal";
} else if (normalizedContractType.includes("engagement")) {
  contractType = "engagement";
} else if (normalizedContractType.includes("couple")) {
  contractType = "couples";
} else if (normalizedContractType.includes("family")) {
  contractType = "family";
} else if (normalizedContractType.includes("portrait")) {
  contractType = "portrait";
} else if (
  normalizedContractType.includes("business") ||
  normalizedContractType.includes("branding")
) {
  contractType = "business";
} else if (
  normalizedContractType.includes("real-estate") ||
  normalizedContractType.includes("real estate") ||
  normalizedContractType.includes("realestate")
) {
  contractType = "real-estate";
} else if (
  normalizedContractType.includes("automotive") ||
  normalizedContractType.includes("auto")
) {
  contractType = "automotive";
} else if (normalizedContractType.includes("event")) {
  contractType = "events";
} else if (normalizedContractType.includes("wedding")) {
  contractType = "wedding";
}
console.log("Contract Type:", rawContractType);
console.log("Normalized:", normalizedContractType);
console.log("Matched:", contractType);


    if (!clientEmail) {
      return NextResponse.json(
        { error: "This contract does not have a client email." },
        { status: 400 }
      );
    }

    const token = contract.signing_token || crypto.randomUUID();

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://camvelle.vercel.app";

    const signingUrl = `${origin}/contract-sign/${token}`;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({
        signing_token: token,
        signing_url: signingUrl,
        status: "sent",
        sent_date: today,
        sent_at: now,
      })
      .eq("id", contract.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const bcc =
      ownerEmail &&
      ownerEmail.toLowerCase().trim() !== clientEmail.toLowerCase().trim()
        ? [ownerEmail]
        : undefined;

    const builtContract = buildContract(contractType);

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
        to: [clientEmail],
        bcc,
        subject: `Review and Sign: ${builtContract.title}`,
        html: `
  <div style="margin:0;padding:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Your Camvelle Creative contract is ready for review and signature.
    </div>

    <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
      <div style="background:#0b0b0b;border:1px solid #252525;border-radius:32px;padding:38px 32px;">
        <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:8px;text-transform:uppercase;color:#777;">
          Camvelle Creative
        </p>

        <h1 style="margin:0 0 26px 0;font-size:42px;line-height:1.05;font-weight:600;color:#ffffff;">
          Contract Ready
        </h1>

        <p style="margin:0 0 24px 0;font-size:18px;line-height:1.8;color:#cfcfcf;">
          Hi ${clientName},
        </p>

        <p style="margin:0 0 28px 0;font-size:18px;line-height:1.8;color:#cfcfcf;">
          Your Camvelle Creative contract is ready for review and electronic signature.
        </p>

        <div style="margin:30px 0;padding:24px;border:1px solid #2f2f2f;border-radius:22px;background:#111;">
          <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#8f8f8f;text-transform:uppercase;letter-spacing:3px;">
            Agreement
          </p>

          <p style="margin:0;font-size:20px;line-height:1.5;font-weight:700;color:#ffffff;">
            ${builtContract.title}
          </p>
        </div>

        <a
          href="${signingUrl}"
          style="display:inline-block;margin:8px 0 30px 0;padding:16px 26px;border-radius:999px;background:#ffffff;color:#050505;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;"
        >
          Review & Sign Contract
        </a>

        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#9a9a9a;">
          Please review the contract PDF on the signing page before signing. After signing, a completed copy will be available for your records.
        </p>

        <p style="margin:24px 0 0 0;font-size:14px;line-height:1.8;color:#777;">
          Thank you for choosing Camvelle Creative.
        </p>

        <p style="margin:8px 0 0 0;font-size:14px;line-height:1.8;color:#777;">
          Camvelle.com
        </p>
      </div>

      <p style="margin:18px 0 0 0;text-align:center;font-size:12px;line-height:1.7;color:#666;">
        Replies go directly to Camvelle Creative.
      </p>
    </div>
  </div>
`,

        text: `Hi ${clientName},

Your Camvelle Creative contract is ready for review and electronic signature.

Agreement: ${builtContract.title}

Review and sign your contract here:
${signingUrl}

Please review the contract PDF on the signing page before signing.

Thank you for choosing Camvelle Creative.

Camvelle.com`,

      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      return NextResponse.json(
        { error: emailResult?.message || "Contract email could not be sent." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contract sent successfully.",
      signingUrl,
      resendId: emailResult?.id || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
