import jsPDF from "jspdf";

interface InvoicePdfData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  projectName: string | undefined;
  issuedDate: string | null;
  dueDate: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  status: string;
  currency: string;
  notes: string | null;
  paymentInstructions: string | null;
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtCurrency(amount: string | number, currency: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (currency === "USD") {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  partial: "Partially Paid",
};

export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 50;
  const marginRight = 50;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 50;

  const colors = {
    primary: [30, 64, 175] as [number, number, number], // blue-800
    dark: [17, 24, 39] as [number, number, number], // gray-900
    medium: [75, 85, 99] as [number, number, number], // gray-600
    light: [156, 163, 175] as [number, number, number], // gray-400
    accent: [239, 246, 255] as [number, number, number], // blue-50
    border: [229, 231, 235] as [number, number, number], // gray-200
  };

  // --- Header ---
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("INVOICE", marginLeft, y);

  // Status badge on the right
  const statusLabel = STATUS_LABELS[data.status] || data.status;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const statusWidth = doc.getTextWidth(statusLabel) + 20;
  const statusX = pageWidth - marginRight - statusWidth;
  doc.setFillColor(...colors.accent);
  doc.roundedRect(statusX, y - 14, statusWidth, 20, 4, 4, "F");
  doc.setTextColor(...colors.primary);
  doc.text(statusLabel, statusX + 10, y);

  y += 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.medium);
  doc.text(data.invoiceNumber, marginLeft, y);

  // --- Divider ---
  y += 20;
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(1);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 25;

  // --- Bill To / Invoice Details (two columns) ---
  const colLeft = marginLeft;
  const colRight = pageWidth / 2 + 20;

  // Left column: Bill To
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.light);
  doc.text("BILL TO", colLeft, y);

  y += 16;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.text(data.clientName, colLeft, y);

  if (data.clientEmail) {
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.medium);
    doc.text(data.clientEmail, colLeft, y);
  }

  if (data.projectName) {
    y += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.medium);
    doc.text(`Project: ${data.projectName}`, colLeft, y);
  }

  // Right column: Invoice details
  let yRight = y - (data.projectName ? 30 : 15) - 16;
  yRight += 16; // skip BILL TO line equivalent

  const detailPairs = [
    ["Issue Date", fmtDate(data.issuedDate)],
    ["Due Date", fmtDate(data.dueDate)],
  ];

  // Right column header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.light);
  doc.text("INVOICE DETAILS", colRight, yRight);
  yRight += 16;

  for (const [label, value] of detailPairs) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.medium);
    doc.text(label, colRight, yRight);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.dark);
    doc.text(value, colRight + 100, yRight);
    yRight += 18;
  }

  y = Math.max(y, yRight) + 30;

  // --- Financial Summary Table ---
  doc.setFillColor(...colors.accent);
  doc.roundedRect(marginLeft, y, contentWidth, 36, 4, 4, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("DESCRIPTION", marginLeft + 15, y + 22);
  doc.text("AMOUNT", pageWidth - marginRight - 15, y + 22, { align: "right" });

  y += 46;

  // Line items (we display the summary lines)
  const items = [
    ["Subtotal", fmtCurrency(data.subtotal, data.currency)],
    [`Tax (${parseFloat(data.taxRate)}%)`, fmtCurrency(data.taxAmount, data.currency)],
  ];

  for (const [label, value] of items) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.dark);
    doc.text(label, marginLeft + 15, y);
    doc.setTextColor(...colors.medium);
    doc.text(value, pageWidth - marginRight - 15, y, { align: "right" });
    y += 12;
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(marginLeft + 15, y, pageWidth - marginRight - 15, y);
    y += 16;
  }

  // Total row (highlighted)
  y += 4;
  doc.setFillColor(...colors.primary);
  doc.roundedRect(marginLeft, y - 6, contentWidth, 34, 4, 4, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Total", marginLeft + 15, y + 14);
  doc.text(fmtCurrency(data.total, data.currency), pageWidth - marginRight - 15, y + 14, {
    align: "right",
  });

  y += 46;

  // Payment summary
  const paymentPaid = parseFloat(data.amountPaid);
  if (paymentPaid > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.medium);
    doc.text("Amount Paid", marginLeft + 15, y);
    doc.text(`- ${fmtCurrency(data.amountPaid, data.currency)}`, pageWidth - marginRight - 15, y, {
      align: "right",
    });
    y += 20;
  }

  const balanceDue = parseFloat(data.balanceDue);
  if (balanceDue > 0 || paymentPaid > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.dark);
    doc.text("Balance Due", marginLeft + 15, y);
    doc.setTextColor(...colors.primary);
    doc.text(fmtCurrency(data.balanceDue, data.currency), pageWidth - marginRight - 15, y, {
      align: "right",
    });
    y += 10;
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(1);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 25;
  }

  // --- Notes ---
  if (data.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.light);
    doc.text("NOTES", marginLeft, y);
    y += 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.medium);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(noteLines, marginLeft, y);
    y += noteLines.length * 14 + 20;
  }

  // --- Payment Instructions ---
  if (data.paymentInstructions) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.light);
    doc.text("PAYMENT INSTRUCTIONS", marginLeft, y);
    y += 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.medium);
    const instrLines = doc.splitTextToSize(data.paymentInstructions, contentWidth);
    doc.text(instrLines, marginLeft, y);
  }

  return doc;
}
