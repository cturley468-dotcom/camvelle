import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export const runtime = "nodejs";

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

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function clean(value: unknown, fallback = "Not provided") {
  const text = String(value || "").trim();
  return text || fallback;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function formatStatus(value: string | null) {
  const status = String(value || "draft").trim();

  return status
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function makeSafeFileName(value: unknown, fallback = "invoice") {
  return (
    String(value || fallback)
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 60) || fallback
  );
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);

    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
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

    await ensureInvoiceBucket(supabaseAdmin);

    const pdfBytes = await createInvoicePdf(invoice);

    const safeInvoiceNumber = makeSafeFileName(
      invoice.invoice_number,
      `invoice-${invoice.id}`
    );

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

async function ensureInvoiceBucket(supabaseAdmin: any) {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  const bucketExists = buckets?.some((bucket: any) => bucket.name === "invoice-files");

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

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.08, 0.08, 0.08);
  const gray = rgb(0.35, 0.35, 0.35);
  const softGray = rgb(0.72, 0.72, 0.72);
  const lightGray = rgb(0.88, 0.88, 0.88);
  const warmPanel = rgb(0.98, 0.97, 0.95);

  const pageWidth = 612;
  const pageHeight = 792;
  const left = 58;
  const right = 554;
  const contentWidth = right - left;
  const topY = 720;
  const bottomSafeY = 100;

  let page: PDFPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = topY;

  function drawFooter(targetPage: PDFPage) {
    targetPage.drawText("Thank you for choosing Camvelle Creative.", {
      x: left,
      y: 58,
      size: 10,
      font: regular,
      color: gray,
    });

    targetPage.drawText("Camvelle.com", {
      x: left,
      y: 38,
      size: 10,
      font: regular,
      color: gray,
    });
  }

  function addNewPage() {
    drawFooter(page);
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = topY;
  }

  function ensureSpace(requiredHeight: number) {
    if (y - requiredHeight < bottomSafeY) {
      addNewPage();
    }
  }

  function drawSectionTitle(title: string) {
    ensureSpace(40);

    page.drawText(title, {
      x: left,
      y,
      size: 15,
      font: bold,
      color: black,
    });

    y -= 28;
  }

  function drawDivider(gap = 34) {
    ensureSpace(gap + 12);

    y -= 8;

    page.drawLine({
      start: { x: left, y },
      end: { x: right, y },
      thickness: 1,
      color: lightGray,
    });

    y -= gap;
  }

  function drawLabelValue(label: string, value: string) {
    ensureSpace(24);

    page.drawText(label, {
      x: left,
      y,
      size: 10.5,
      font: bold,
      color: black,
    });

    page.drawText(value, {
      x: 190,
      y,
      size: 10.5,
      font: regular,
      color: black,
    });

    y -= 24;
  }

  function drawParagraph(text: string) {
    const lines = wrapText(text, regular, 10.5, contentWidth);
    ensureSpace(lines.length * 16 + 16);

    for (const line of lines) {
      page.drawText(line, {
        x: left,
        y,
        size: 10.5,
        font: regular,
        color: gray,
      });

      y -= 16;
    }

    y -= 10;
  }

  const invoiceNumber = clean(invoice.invoice_number, "Invoice");
  const clientName = clean(invoice.client_name);
  const clientEmail = clean(invoice.client_email);
  const status = formatStatus(invoice.status);
  const dueDate = clean(invoice.due_date);
  const createdDate = clean(
    invoice.created_at
      ? new Date(invoice.created_at).toLocaleDateString()
      : "",
    "Not provided"
  );
  const amountDue = formatMoney(Number(invoice.amount || 0));

  // Header
  page.drawText("CAMVELLE CREATIVE", {
    x: left,
    y,
    size: 16,
    font: bold,
    color: black,
  });

  y -= 22;

  page.drawText("Photography • Video • Design", {
    x: left,
    y,
    size: 9,
    font: regular,
    color: gray,
  });

  y -= 50;

  page.drawText("INVOICE", {
    x: left,
    y,
    size: 38,
    font: bold,
    color: black,
  });

  page.drawText(invoiceNumber, {
    x: 390,
    y: y + 8,
    size: 12,
    font: bold,
    color: gray,
  });

  y -= 54;

  // Amount card
  const cardHeight = 112;

  page.drawRectangle({
    x: left,
    y: y - cardHeight,
    width: contentWidth,
    height: cardHeight,
    color: warmPanel,
    borderColor: lightGray,
    borderWidth: 1,
  });

  page.drawText("Amount Due", {
    x: left + 24,
    y: y - 38,
    size: 12,
    font: bold,
    color: gray,
  });

  page.drawText(amountDue, {
    x: left + 24,
    y: y - 78,
    size: 30,
    font: bold,
    color: black,
  });

  page.drawText("Due Date", {
    x: 385,
    y: y - 38,
    size: 10,
    font: bold,
    color: gray,
  });

  page.drawText(dueDate, {
    x: 385,
    y: y - 62,
    size: 13,
    font: bold,
    color: black,
  });

  page.drawText("Status", {
    x: 385,
    y: y - 88,
    size: 10,
    font: bold,
    color: gray,
  });

  page.drawText(status, {
    x: 435,
    y: y - 88,
    size: 10,
    font: regular,
    color: black,
  });

  y -= cardHeight + 44;

  drawSectionTitle("Invoice Details");

  drawLabelValue("Invoice Number:", invoiceNumber);
  drawLabelValue("Client:", clientName);
  drawLabelValue("Email:", clientEmail);
  drawLabelValue("Status:", status);
  drawLabelValue("Issue Date:", createdDate);
  drawLabelValue("Due Date:", dueDate);

  drawDivider(36);

  drawSectionTitle("Summary");

  const summaryHeight = 62;

  ensureSpace(summaryHeight + 20);

  page.drawRectangle({
    x: left,
    y: y - summaryHeight,
    width: contentWidth,
    height: summaryHeight,
    color: rgb(1, 1, 1),
    borderColor: lightGray,
    borderWidth: 1,
  });

  page.drawText("Photography Services", {
    x: left + 20,
    y: y - 26,
    size: 11,
    font: bold,
    color: black,
  });

  page.drawText("Camvelle Creative invoice balance", {
    x: left + 20,
    y: y - 45,
    size: 9.5,
    font: regular,
    color: gray,
  });

  page.drawText(amountDue, {
    x: 448,
    y: y - 34,
    size: 13,
    font: bold,
    color: black,
  });

  y -= summaryHeight + 42;

  if (invoice.notes) {
    drawSectionTitle("Notes");

    drawParagraph(invoice.notes);
  }

  drawDivider(34);

  drawSectionTitle("Payment Notes");

  drawParagraph(
    "Please review this invoice and reach out with any questions. Payment instructions or next steps may be provided separately by Camvelle Creative."
  );

  page.drawText("Total Due", {
    x: left,
    y: 142,
    size: 13,
    font: bold,
    color: black,
  });

  page.drawText(amountDue, {
    x: 430,
    y: 142,
    size: 22,
    font: bold,
    color: black,
  });

  page.drawLine({
    start: { x: left, y: 124 },
    end: { x: right, y: 124 },
    thickness: 1,
    color: softGray,
  });

  drawFooter(page);

  return await pdfDoc.save();
}
