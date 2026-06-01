import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    const contractFromEmail =
      process.env.CONTRACT_FROM_EMAIL ||
      process.env.INVOICE_FROM_EMAIL ||
      "Camvelle Creative <contracts@camvelle.com>";

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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json(
        { error: "Missing contractId." },
        { status: 400 }
      );
    }

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

    const clientName =
      contract.client_name ||
      client?.full_name ||
      client?.name ||
      "there";

    const clientEmail = contract.client_email || client?.email;

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

    const { error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({
        signing_token: token,
        signing_url: signingUrl,
        status: "sent",
        sent_date: today,
      })
      .eq("id", contract.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const contractType =
      contract.contract_type || contract.type || "Photography Agreement";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "camvelle-app/1.0",
      },
      body: JSON.stringify({
        from: contractFromEmail,
        to: [clientEmail],
        subject: `${contractType} from Camvelle Creative`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2>Camvelle Creative</h2>

            <p>Hi ${clientName},</p>

            <p>Your contract is ready for review and signature.</p>

            <p>
              <strong>Contract:</strong> ${contractType}<br />
              <strong>Status:</strong> Sent
            </p>

            <p>
              <a href="${signingUrl}" style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:999px;">
                Review & Sign Contract
              </a>
            </p>

            <p>Thank you for choosing Camvelle Creative.</p>

            <p style="color:#666;font-size:13px;">
              Camvelle.com
            </p>
          </div>
        `,
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
