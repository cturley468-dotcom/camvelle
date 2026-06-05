import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    const galleryDescription = clean(gallery.description);

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://camvelle.vercel.app";

    const galleryUrl = `${origin}/gallery/${gallery.share_token}`;

    const { count, error: countError } = await supabaseAdmin
      .from("client_gallery_photos")
      .select("id", { count: "exact", head: true })
      .eq("gallery_id", gallery.id);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    const photoCount = count || 0;

    const safeClientName = escapeHtml(clientName);
    const safeGalleryTitle = escapeHtml(galleryTitle);
    const safeDescription = escapeHtml(galleryDescription);
    const safeGalleryUrl = escapeHtml(galleryUrl);

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
          <div style="margin:0;padding:0;background:#050505;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif;">
            <div style="max-width:680px;margin:0 auto;padding:34px 18px;">
              <div style="border:1px solid rgba(255,255,255,0.12);background:#111111;border-radius:38px;padding:42px 34px;box-shadow:0 0 70px rgba(255,255,255,0.05);">
                
                <p style="margin:0 0 24px 0;color:rgba(245,240,231,0.42);font-size:11px;letter-spacing:0.45em;text-transform:uppercase;">
                  Camvelle Creative
                </p>

                <h1 style="margin:0;color:#f5f0e7;font-size:44px;line-height:0.95;font-weight:700;letter-spacing:-0.06em;">
                  Gallery<br />Ready
                </h1>

                <p style="margin:34px 0 0 0;color:rgba(245,240,231,0.78);font-size:21px;line-height:1.6;">
                  Hi ${safeClientName},
                </p>

                <p style="margin:28px 0 0 0;color:rgba(245,240,231,0.72);font-size:21px;line-height:1.7;">
                  Your private Camvelle gallery is ready to view.
                </p>

                <div style="margin:34px 0 0 0;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.035);border-radius:28px;padding:26px;">
                  <p style="margin:0 0 14px 0;color:rgba(245,240,231,0.92);font-size:18px;line-height:1.5;">
                    <strong>Gallery:</strong> ${safeGalleryTitle}
                  </p>

                  <p style="margin:0 0 14px 0;color:rgba(245,240,231,0.92);font-size:18px;line-height:1.5;">
                    <strong>Photos:</strong> ${photoCount}
                  </p>

                  <p style="margin:0;color:rgba(245,240,231,0.92);font-size:18px;line-height:1.5;">
                    <strong>Status:</strong> Ready
                  </p>
                </div>

                ${
                  galleryDescription
                    ? `
                      <p style="margin:30px 0 0 0;color:rgba(245,240,231,0.68);font-size:18px;line-height:1.7;">
                        ${safeDescription}
                      </p>
                    `
                    : ""
                }

                <div style="margin:38px 0 0 0;">
                  <a href="${safeGalleryUrl}" style="display:inline-block;background:#f5f0e7;color:#050505;text-decoration:none;border-radius:999px;padding:17px 28px;font-size:12px;font-weight:700;letter-spacing:0.34em;text-transform:uppercase;">
                    View Your Gallery
                  </a>
                </div>

                <p style="margin:34px 0 0 0;color:rgba(245,240,231,0.58);font-size:15px;line-height:1.7;">
                  You can also copy and paste this link into your browser:<br />
                  <span style="color:rgba(245,240,231,0.78);word-break:break-all;">
                    ${safeGalleryUrl}
                  </span>
                </p>

                <p style="margin:38px 0 0 0;color:rgba(245,240,231,0.72);font-size:19px;line-height:1.7;">
                  Thank you for choosing Camvelle Creative.
                </p>

                <p style="margin:18px 0 0 0;color:rgba(245,240,231,0.34);font-size:15px;">
                  Camvelle.com
                </p>
              </div>
            </div>
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
