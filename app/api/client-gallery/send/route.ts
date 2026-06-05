import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

  return createClient(supabaseUrl, serviceRoleKey);
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

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const resendApiKey = process.env.RESEND_API_KEY;

    const galleryFromEmail =
      process.env.GALLERY_FROM_EMAIL ||
      process.env.CONTRACT_FROM_EMAIL ||
      "Camvelle Creative <contracts@camvelle.com>";

    const replyToEmail =
      process.env.CAMVELLE_REPLY_TO_EMAIL || "cam@camvelle.com";

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing admin session." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(accessToken);

    const adminEmail = userData.user?.email?.toLowerCase() || "";
    const allowedAdminEmails = getAllowedAdminEmails();

    if (userError || !allowedAdminEmails.includes(adminEmail)) {
      return NextResponse.json(
        { error: "Not authorized to send gallery emails." },
        { status: 403 }
      );
    }

    const { galleryId } = await request.json();

    if (!galleryId) {
      return NextResponse.json(
        { error: "Missing galleryId." },
        { status: 400 }
      );
    }

    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from("client_galleries")
      .select("*")
      .eq("id", galleryId)
      .single();

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: galleryError?.message || "Gallery not found." },
        { status: 404 }
      );
    }

    const clientEmail = clean(gallery.client_email);

    if (!clientEmail) {
      return NextResponse.json(
        { error: "This gallery does not have a client email." },
        { status: 400 }
      );
    }

    const clientName = clean(gallery.client_name, "there");
    const galleryTitle = clean(gallery.title, "Your Camvelle Gallery");

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://camvelle.vercel.app";

    const galleryUrl = `${origin}/gallery/${gallery.share_token}`;

    const { count } = await supabaseAdmin
      .from("client_gallery_photos")
      .select("id", { count: "exact", head: true })
      .eq("gallery_id", gallery.id);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "camvelle-app/1.0",
      },
      body: JSON.stringify({
        from: galleryFromEmail,
        reply_to: replyToEmail,
        to: [clientEmail],
        subject: `${galleryTitle} is ready - Camvelle Creative`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2>Camvelle Creative</h2>

            <p>Hi ${clientName},</p>

            <p>Your private Camvelle gallery is ready to view.</p>

            <p>
              <strong>Gallery:</strong> ${galleryTitle}<br />
              <strong>Photos:</strong> ${count || 0}<br />
              <strong>Status:</strong> Ready
            </p>

            ${
              gallery.description
                ? `<p>${gallery.description}</p>`
                : ""
            }

            <p>
              <a href="${galleryUrl}" style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:999px;">
                View Your Gallery
              </a>
            </p>

            <p>
              You can also copy and paste this link into your browser:<br />
              <span style="color:#555;font-size:13px;">${galleryUrl}</span>
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
        { error: emailResult?.message || "Gallery email could not be sent." },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("client_galleries")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", gallery.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gallery email sent successfully.",
      galleryUrl,
      resendId: emailResult?.id || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
