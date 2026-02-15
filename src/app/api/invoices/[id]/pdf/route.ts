import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface PdfInvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

interface PdfInvoiceData {
  number: string;
  type: string;
  date: string;
  dueDate: string | null;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  clientCompany: string | null;
  projectName: string | null;
  items: PdfInvoiceItem[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  notes: string | null;
}

function formatDateForPdf(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrencyForPdf(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

async function generatePdfBuffer(data: PdfInvoiceData): Promise<Uint8Array> {
  const ReactPdf = await import("@react-pdf/renderer");
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } = ReactPdf;
  const React = (await import("react")).default;

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#333333",
    },
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      marginBottom: 30,
      borderBottomWidth: 2,
      borderBottomColor: "#2563eb",
      paddingBottom: 20,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      alignItems: "flex-end" as const,
    },
    title: {
      fontSize: 24,
      fontFamily: "Helvetica-Bold",
      color: "#2563eb",
      marginBottom: 4,
    },
    invoiceNumber: {
      fontSize: 12,
      color: "#666666",
    },
    dateText: {
      fontSize: 10,
      color: "#666666",
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#2563eb",
      marginBottom: 6,
      textTransform: "uppercase" as const,
    },
    infoRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      marginBottom: 20,
    },
    infoBlock: {
      width: "48%",
    },
    infoText: {
      fontSize: 10,
      marginBottom: 2,
      color: "#333333",
    },
    infoBold: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      marginBottom: 2,
    },
    table: {
      marginTop: 10,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row" as const,
      backgroundColor: "#2563eb",
      padding: 8,
      borderRadius: 4,
    },
    tableHeaderText: {
      color: "#ffffff",
      fontFamily: "Helvetica-Bold",
      fontSize: 9,
    },
    tableRow: {
      flexDirection: "row" as const,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    tableRowAlt: {
      flexDirection: "row" as const,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      backgroundColor: "#f9fafb",
    },
    colDescription: {
      width: "45%",
    },
    colQuantity: {
      width: "15%",
      textAlign: "right" as const,
    },
    colUnitPrice: {
      width: "20%",
      textAlign: "right" as const,
    },
    colTotal: {
      width: "20%",
      textAlign: "right" as const,
    },
    summaryContainer: {
      flexDirection: "row" as const,
      justifyContent: "flex-end" as const,
      marginTop: 10,
    },
    summaryBox: {
      width: 220,
    },
    summaryRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      paddingVertical: 4,
    },
    summaryLabel: {
      fontSize: 10,
      color: "#666666",
    },
    summaryValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
    },
    summaryTotalRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      paddingVertical: 6,
      borderTopWidth: 2,
      borderTopColor: "#2563eb",
      marginTop: 4,
    },
    summaryTotalLabel: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    summaryTotalValue: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: "#2563eb",
    },
    notesSection: {
      marginTop: 30,
      padding: 12,
      backgroundColor: "#f9fafb",
      borderRadius: 4,
    },
    notesText: {
      fontSize: 9,
      color: "#666666",
      lineHeight: 1.5,
    },
    footer: {
      position: "absolute" as const,
      bottom: 30,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 10,
    },
    footerText: {
      fontSize: 8,
      color: "#999999",
      textAlign: "center" as const,
    },
  });

  const freelancerName = process.env.FREELANCER_NAME || "Professional Studio";
  const freelancerAddress = process.env.FREELANCER_ADDRESS || "";
  const freelancerVat = process.env.FREELANCER_PIVA || "";
  const titleLabel = data.type === "QUOTE" ? "QUOTE" : "INVOICE";

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.headerLeft },
          React.createElement(Text, { style: styles.title }, titleLabel),
          React.createElement(Text, { style: styles.invoiceNumber }, `No. ${data.number}`)
        ),
        React.createElement(
          View,
          { style: styles.headerRight },
          React.createElement(Text, { style: styles.dateText }, `Date: ${data.date}`),
          data.dueDate
            ? React.createElement(Text, { style: styles.dateText }, `Due: ${data.dueDate}`)
            : null
        )
      ),
      // Info blocks
      React.createElement(
        View,
        { style: styles.infoRow },
        // From
        React.createElement(
          View,
          { style: styles.infoBlock },
          React.createElement(Text, { style: styles.sectionTitle }, "From"),
          React.createElement(Text, { style: styles.infoBold }, freelancerName),
          freelancerAddress
            ? React.createElement(Text, { style: styles.infoText }, freelancerAddress)
            : null,
          freelancerVat
            ? React.createElement(Text, { style: styles.infoText }, `VAT: ${freelancerVat}`)
            : null
        ),
        // To
        React.createElement(
          View,
          { style: styles.infoBlock },
          React.createElement(Text, { style: styles.sectionTitle }, "To"),
          React.createElement(Text, { style: styles.infoBold }, data.clientName),
          data.clientCompany
            ? React.createElement(Text, { style: styles.infoText }, data.clientCompany)
            : null,
          data.clientAddress
            ? React.createElement(Text, { style: styles.infoText }, data.clientAddress)
            : null,
          data.clientEmail
            ? React.createElement(Text, { style: styles.infoText }, data.clientEmail)
            : null
        )
      ),
      // Project reference
      data.projectName
        ? React.createElement(
            View,
            { style: { marginBottom: 10 } },
            React.createElement(Text, { style: styles.infoText }, `Project: ${data.projectName}`)
          )
        : null,
      // Items table
      React.createElement(
        View,
        { style: styles.table },
        // Table header
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colDescription } }, "Description"),
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colQuantity } }, "Qty"),
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colUnitPrice } }, "Unit Price"),
          React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colTotal } }, "Total")
        ),
        // Table rows
        ...data.items.map((item, index) =>
          React.createElement(
            View,
            { key: index, style: index % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
            React.createElement(Text, { style: styles.colDescription }, item.description),
            React.createElement(Text, { style: styles.colQuantity }, item.quantity),
            React.createElement(Text, { style: styles.colUnitPrice }, formatCurrencyForPdf(item.unitPrice)),
            React.createElement(Text, { style: styles.colTotal }, formatCurrencyForPdf(item.total))
          )
        )
      ),
      // Summary
      React.createElement(
        View,
        { style: styles.summaryContainer },
        React.createElement(
          View,
          { style: styles.summaryBox },
          React.createElement(
            View,
            { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, "Subtotal"),
            React.createElement(Text, { style: styles.summaryValue }, formatCurrencyForPdf(data.subtotal))
          ),
          React.createElement(
            View,
            { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, `Tax (${data.taxRate}%)`),
            React.createElement(Text, { style: styles.summaryValue }, formatCurrencyForPdf(data.taxAmount))
          ),
          React.createElement(
            View,
            { style: styles.summaryTotalRow },
            React.createElement(Text, { style: styles.summaryTotalLabel }, "Total"),
            React.createElement(Text, { style: styles.summaryTotalValue }, formatCurrencyForPdf(data.total))
          )
        )
      ),
      // Notes
      data.notes
        ? React.createElement(
            View,
            { style: styles.notesSection },
            React.createElement(Text, { style: styles.sectionTitle }, "Notes"),
            React.createElement(Text, { style: styles.notesText }, data.notes)
          )
        : null,
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          { style: styles.footerText },
          data.type === "QUOTE"
            ? "This quote is valid for 30 days from the date of issue."
            : "Payment due within 30 days from the date of issue. Thank you for your business."
        )
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  return new Uint8Array(buffer);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      items: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const pdfData: PdfInvoiceData = {
    number: invoice.number,
    type: invoice.type,
    date: formatDateForPdf(invoice.date),
    dueDate: invoice.dueDate ? formatDateForPdf(invoice.dueDate) : null,
    clientName: invoice.client.name,
    clientEmail: invoice.client.email,
    clientAddress: invoice.client.address,
    clientCompany: invoice.client.company,
    projectName: invoice.project?.name ?? null,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      total: String(item.total),
    })),
    subtotal: String(invoice.subtotal),
    taxRate: String(invoice.taxRate),
    taxAmount: String(invoice.taxAmount),
    total: String(invoice.total),
    notes: invoice.notes,
  };

  const pdfBytes = await generatePdfBuffer(pdfData);
  const filename = `${invoice.number}.pdf`;
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
