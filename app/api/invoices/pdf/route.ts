import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

type Invoice = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceId = body.invoiceId;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId." },
        { status: 400 }
      );
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

    await ensureInvoiceBucket();

    const pdfBytes = await createInvoicePdf(invoice);

    const safeInvoiceNumber =
      invoice.invoice_number?.replace(/[^a-zA-Z0-9-_]/g, "") ||
      `invoice-${invoice.id}`;

    const filePath = `${invoice.client_id || "general"}/${safeInvoiceNumber}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("invoice-files")
      .upload(filePath, Buffer.from(pdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicData } = supabaseAdmin.storage
      .from("invoice-files")
      .getPublicUrl(filePath);

    const pdfUrl = publicData.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        invoice_pdf_url: pdfUrl,
      })
      .eq("id", invoice.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice_pdf_url: pdfUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function ensureInvoiceBucket() {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === "invoice-files");

  if (!bucketExists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      "invoice-files",
      {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10,
        allowedMimeTypes: ["application/pdf"],
      }
    );

    if (createError) {
      throw new Error(createError.message);
    }

    return;
  }

  await supabaseAdmin.storage.updateBucket("invoice-files", {
    public: true,
    fileSizeLimit: 1024 * 1024 * 10,
    allowedMimeTypes: ["application/pdf"],
  });
}

async function createInvoicePdf(invoice: Invoice) {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.05, 0.05, 0.05);
  const gray = rgb(0.35, 0.35, 0.35);
  const lightGray = rgb(0.85, 0.85, 0.85);

  const margin = 54;
  let y = 720;

  page.drawText("CAMVELLE CREATIVE", {
    x: margin,
    y,
    size: 18,
    font: boldFont,
    color: black,
  });

  y -= 24;

  page.drawText("Photography • Video • Design", {
    x: margin,
    y,
    size: 10,
    font,
    color: gray,
  });

  y -= 58;

  page.drawText("INVOICE", {
    x: margin,
    y,
    size: 38,
    font: boldFont,
    color: black,
  });

  y -= 48;

  drawLabelValue(
    page,
    boldFont,
    font,
    "Invoice Number",
    invoice.invoice_number || "Not provided",
    margin,
    y
  );

  y -= 24;

  drawLabelValue(
    page,
    boldFont,
    font,
    "Client",
    invoice.client_name || "Not provided",
    margin,
    y
  );

  y -= 24;

  drawLabelValue(
    page,
    boldFont,
    font,
    "Email",
    invoice.client_email || "Not provided",
    margin,
    y
  );

  y -= 24;

  drawLabelValue(
    page,
    boldFont,
    font,
    "Status",
    invoice.status || "draft",
    margin,
    y
  );

  y -= 24;

  drawLabelValue(
    page,
    boldFont,
    font,
    "Due Date",
    invoice.due_date || "Not provided",
    margin,
    y
  );

  y -= 45;

  page.drawLine({
    start: { x: margin, y },
    end: { x: 558, y },
    thickness: 1,
    color: lightGray,
  });

  y -= 48;

  page.drawText("Amount Due", {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: black,
  });

  page.drawText(formatMoney(Number(invoice.amount || 0)), {
    x: 390,
    y,
    size: 26,
    font: boldFont,
    color: black,
  });

  y -= 70;

  if (invoice.notes) {
    page.drawText("Notes", {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: black,
    });

    y -= 24;

    const wrappedNotes = wrapText(invoice.notes, 78);

    wrappedNotes.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font,
        color: gray,
      });

      y -= 16;
    });
  }

  page.drawText("Thank you for choosing Camvelle Creative.", {
    x: margin,
    y: 72,
    size: 11,
    font,
    color: gray,
  });

  page.drawText("CamVelle.com", {
    x: margin,
    y: 52,
    size: 10,
    font,
    color: gray,
  });

  return await pdfDoc.save();
}

function drawLabelValue(
  page: any,
  boldFont: any,
  font: any,
  label: string,
  value: string,
  x: number,
  y: number
) {
  page.drawText(`${label}:`, {
    x,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText(value, {
    x: x + 125,
    y,
    size: 11,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function wrapText(text: string, maxLength: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
