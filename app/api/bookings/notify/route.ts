import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
}

function formatSessionType(value: unknown) {
  return clean(value, "Photography Session")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.CAMVELLE_BOOKING_FROM_EMAIL ||
      process.env.CONTRACT_FROM_EMAIL ||
      "Camvelle Creative <contracts@camvelle.com>";

    const replyToEmail =
      process.env.CAMVELLE_REPLY_TO_EMAIL ||
      process.env.CONTRACT_REPLY_TO_EMAIL ||
      "cam@camvelle.com";

    const ownerEmail =
      process.env.CAMVELLE_OWNER_EMAIL ||
      process.env.OWNER_EMAIL ||
      "cam@camvelle.com";

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const clientName = clean(
      body.clientName || body.full_name || body.name,
      "Client"
    );

    const clientEmail = clean(body.clientEmail || body.email, "");

    const clientPhone = clean(body.clientPhone || body.phone);
    const sessionType = formatSessionType(
      body.sessionType || body.session_type || body.project_type || body.type
    );

    const preferredDate = clean(
      body.preferredDate || body.preferred_date || body.date
    );

    const preferredTime = clean(
      body.preferredTime || body.preferred_time || body.time
    );

    const location = clean(
      body.location || body.city || body.project_location || body.address
    );

    const details = clean(
      body.details || body.message || body.notes || body.description,
      "No details provided."
    );

    if (!clientEmail) {
      return NextResponse.json(
        { error: "Missing client email." },
        { status: 400 }
      );
    }

    const ownerHtml = `
      <div style="margin:0;padding:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
        <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
          <div style="background:#0b0b0b;border:1px solid #252525;border-radius:32px;padding:38px 32px;">
            <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:8px;text-transform:uppercase;color:#777;">
              Camvelle Creative
            </p>

            <h1 style="margin:0 0 26px 0;font-size:40px;line-height:1.05;font-weight:600;color:#ffffff;">
              New Booking Request
            </h1>

            <p style="margin:0 0 28px 0;font-size:17px;line-height:1.8;color:#cfcfcf;">
              A new booking request has been submitted through Camvelle.
            </p>

            <div style="margin:30px 0;padding:24px;border:1px solid #2f2f2f;border-radius:22px;background:#111;">
              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                <strong>Client:</strong> ${clientName}
              </p>

              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                <strong>Email:</strong> ${clientEmail}
              </p>

              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                <strong>Phone:</strong> ${clientPhone}
              </p>

              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                <strong>Session:</strong> ${sessionType}
              </p>

              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                <strong>Preferred Date:</strong> ${preferredDate}
              </p>

              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                <strong>Preferred Time:</strong> ${preferredTime}
              </p>

              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                <strong>Location:</strong> ${location}
              </p>

              <p style="margin:20px 0 0 0;font-size:16px;line-height:1.8;color:#cfcfcf;">
                <strong>Details:</strong><br />
                ${details}
              </p>
            </div>

            <p style="margin:24px 0 0 0;font-size:14px;line-height:1.8;color:#777;">
              Log in to the Camvelle dashboard to review the request.
            </p>
          </div>
        </div>
      </div>
    `;

    const clientHtml = `
      <div style="margin:0;padding:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          Your Camvelle Creative booking request has been received.
        </div>

        <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
          <div style="background:#0b0b0b;border:1px solid #252525;border-radius:32px;padding:38px 32px;">
            <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:8px;text-transform:uppercase;color:#777;">
              Camvelle Creative
            </p>

            <h1 style="margin:0 0 26px 0;font-size:42px;line-height:1.05;font-weight:600;color:#ffffff;">
              Request Received
            </h1>

            <p style="margin:0 0 24px 0;font-size:18px;line-height:1.8;color:#cfcfcf;">
              Hi ${clientName},
            </p>

            <p style="margin:0 0 28px 0;font-size:18px;line-height:1.8;color:#cfcfcf;">
              Thank you for reaching out to Camvelle Creative. Your booking request has been received.
            </p>

            <div style="margin:30px 0;padding:24px;border:1px solid #2f2f2f;border-radius:22px;background:#111;">
              <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#8f8f8f;text-transform:uppercase;letter-spacing:3px;">
                Request Summary
              </p>

              <p style="margin:0 0 14px 0;font-size:18px;line-height:1.6;color:#ffffff;">
                ${sessionType}
              </p>

              <p style="margin:0;font-size:15px;line-height:1.8;color:#bfbfbf;">
                Preferred Date: ${preferredDate}<br />
                Location: ${location}
              </p>
            </div>

            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#9a9a9a;">
              Camvelle Creative will review your request and follow up with availability, next steps, and any needed details.
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
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "camvelle-app/1.0",
      },
      body: JSON.stringify({
        from: fromEmail,
        reply_to: replyToEmail,
        to: [clientEmail],
        bcc:
          ownerEmail && ownerEmail.toLowerCase().trim() !== clientEmail.toLowerCase().trim()
            ? [ownerEmail]
            : undefined,
        subject: "Your Camvelle Creative booking request was received",
        html: clientHtml,
        text: `Hi ${clientName},

Thank you for reaching out to Camvelle Creative. Your booking request has been received.

Request Summary:
Session: ${sessionType}
Preferred Date: ${preferredDate}
Preferred Time: ${preferredTime}
Location: ${location}

Camvelle Creative will review your request and follow up with availability, next steps, and any needed details.

Thank you for choosing Camvelle Creative.

Camvelle.com`,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      return NextResponse.json(
        { error: emailResult.message || "Booking confirmation email failed." },
        { status: 500 }
      );
    }

    const ownerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "camvelle-app/1.0",
      },
      body: JSON.stringify({
        from: fromEmail,
        reply_to: replyToEmail,
        to: [ownerEmail],
        subject: `New Booking Request: ${sessionType} - ${clientName}`,
        html: ownerHtml,
        text: `New booking request submitted.

Client: ${clientName}
Email: ${clientEmail}
Phone: ${clientPhone}
Session: ${sessionType}
Preferred Date: ${preferredDate}
Preferred Time: ${preferredTime}
Location: ${location}

Details:
${details}

Log in to the Camvelle dashboard to review the request.`,
      }),
    });

    const ownerResult = await ownerResponse.json();

    if (!ownerResponse.ok) {
      return NextResponse.json(
        { error: ownerResult.message || "Owner notification email failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Booking notification emails sent.",
      clientEmailId: emailResult.id,
      ownerEmailId: ownerResult.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
