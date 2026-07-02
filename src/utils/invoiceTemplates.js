/**
 * Invoice Templates for Billora App
 * Adapted from Admin templates for React Native
 */

// Helper function to safely parse numbers
const parseNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
};

// Helper function to safely format currency
const formatCurrency = (value) => {
  const num = parseNumber(value);
  return `₹${num.toFixed(2)}`;
};

// Helper function to truncate long product names for thermal paper
const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

// Helper function to escape HTML
const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// Calculate totals from invoice items
const calculateSubtotal = (items) => {
  let subtotal = 0;
  if (items && Array.isArray(items)) {
    subtotal += items.reduce((sum, item) => {
      const price = parseNumber(item.price);
      const quantity = parseNumber(item.quantity);
      return sum + price * quantity;
    }, 0);
  }
  return subtotal;
};

const calculateTotalGST = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const price = parseNumber(item.price);
    const gstPercent = parseNumber(item.gst);
    const quantity = parseNumber(item.quantity);
    const subtotal = price * quantity;
    const discount = parseNumber(item.discount);
    const afterDiscount = subtotal - (subtotal * discount) / 100;
    return sum + (afterDiscount * gstPercent) / 100;
  }, 0);
};

const calculateTotalDiscount = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const price = parseNumber(item.price);
    const discountPercent = parseNumber(item.discount);
    const quantity = parseNumber(item.quantity);
    const subtotal = price * quantity;
    return sum + (subtotal * discountPercent) / 100;
  }, 0);
};

// Format date
const formatDate = (date) => {
  if (!date)
    return new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Generate A4 Invoice HTML
 */
export const generateA4InvoiceHTML = (invoice, isOrderDetails = false) => {
  if (!invoice) return "";

  const items = invoice.items || invoice.invoice_items || [];
  const subtotal = calculateSubtotal(items);
  const totalGST = calculateTotalGST(items);
  const totalDiscount = calculateTotalDiscount(items);
  const totalAmount = parseNumber(
    invoice.total_amount || invoice.totalAmount,
    subtotal - totalDiscount + totalGST,
  );
  const paidAmount = parseNumber(invoice.paid_amount || invoice.paidAmount, 0);
  const changeAmount = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const dueAmount = paidAmount < totalAmount ? totalAmount - paidAmount : 0;

  // Render items section
  const renderItemsSection = () => {
    let html = "";
    if (items && items.length > 0) {
      items.forEach((item, idx) => {
        const price = parseNumber(item.price);
        const qty = parseNumber(item.quantity, 1);
        const total = parseNumber(item.total_price, price * qty);
        const gst = parseNumber(item.gst);
        const discount = parseNumber(item.discount);
        const productName =
          item.product?.name || item.product_name || item.name || "Product";

        html += `<tr>
          <td style="text-align: left;">${idx + 1}</td>
          <td style="text-align: left;">${escapeHtml(productName)}</td>
          <td style="text-align: center;">${qty}</td>
          <td style="text-align: center;">${formatCurrency(price)}</td>
          <td style="text-align: center;">${gst > 0 ? `${gst}%` : "—"}</td>
          <td style="text-align: center;">${discount > 0 ? `${discount}%` : "—"}</td>
          <td style="text-align: center; font-weight: 600;">${formatCurrency(total)}</td>
        </tr>`;
      });
    } else {
      html += `<tr><td colspan="7" style="text-align: center; padding: 28px; color: #8aa0b5;">No items found</td></tr>`;
    }
    return html;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isOrderDetails ? "Order Details" : "Invoice #"}${invoice.invoice_number || invoice.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0.8cm 0.8cm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      background: #f0f2f5;
      padding: 20px 16px;
      color: #1a2332;
    }
    .invoice-wrapper {
      max-width: 1000px;
      width: 100%;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .invoice-container { padding: 30px 35px 25px; }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 2px solid #e8edf3;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 700;
      color: #0b1a2a;
      margin-bottom: 4px;
    }
    .invoice-badge {
      text-align: right;
      background: #f4f7fb;
      padding: 10px 22px;
      border-radius: 30px;
      min-width: 160px;
    }
    .invoice-badge h2 {
      font-size: 22px;
      font-weight: 800;
      color: #1a3c5e;
      margin: 0;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      gap: 10px 20px;
      background: #f7faff;
      padding: 12px 18px;
      border-radius: 10px;
      margin-bottom: 16px;
      border: 1px solid #eef3f9;
    }
    .meta-block { flex: 1; min-width: 120px; }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6f859d;
      margin-bottom: 2px;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #142433;
    }
    .customer-card {
      background: #fafcfe;
      border: 1px solid #e8eef5;
      border-radius: 10px;
      padding: 12px 18px;
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4a6a88;
      margin-bottom: 6px;
      border-left: 3px solid #2b7ba8;
      padding-left: 10px;
    }
    .modern-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      border-radius: 8px;
      overflow: hidden;
    }
    .modern-table th {
      background: #1f2f3f;
      color: white;
      font-weight: 600;
      padding: 8px 10px;
      font-size: 11px;
      text-align: center;
    }
    .modern-table th:first-child { text-align: left; }
    .modern-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #eef2f7;
      text-align: center;
    }
    .modern-table td:first-child { text-align: left; }
    .summary-payment-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .summary-box, .payment-box {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e6ecf3;
      border-radius: 12px;
      padding: 14px 18px;
      min-width: 200px;
    }
    .summary-box { background: #f9fcff; }
    .payment-box { background: #f8fafd; }
    .box-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #3d607d;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #dce4ed;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .total-row {
      margin-top: 6px;
      padding-top: 8px;
      border-top: 2px solid #dfe6ef;
      font-weight: 800;
      font-size: 16px;
    }
    .payment-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .amount-paid { font-weight: 700; color: #1f6e3a; }
    .due-amount { color: #b53b2a; font-weight: 700; }
    .footer-note {
      margin-top: 14px;
      text-align: center;
      border-top: 1px solid #e8edf3;
      padding-top: 12px;
      font-size: 10.5px;
      color: #7f94ab;
    }
    @media print {
      body { background: white; padding: 0; margin: 0; }
      .invoice-wrapper { box-shadow: none; border-radius: 0; max-width: 100%; }
      .invoice-container { padding: 0.3cm 0.4cm; }
    }
  </style>
</head>
<body>
<div class="invoice-wrapper">
  <div class="invoice-container">
    <div class="header-row">
      <div class="brand-name">${escapeHtml(invoice.store_name || "Store")}</div>
      <div class="invoice-badge">
        <h2>TAX INVOICE</h2>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-block">
        <div class="meta-label">${isOrderDetails ? "Order Number" : "Invoice Number"}</div>
        <div class="meta-value">${escapeHtml(invoice.invoice_number || invoice.order_id || invoice.id || "INV-001")}</div>
      </div>
      <div class="meta-block">
        <div class="meta-label">${isOrderDetails ? "Order Date" : "Invoice Date"}</div>
        <div class="meta-value">${formatDate(invoice.created_at)}</div>
      </div>
      <div class="meta-block">
        <div class="meta-label">Order / Bill No</div>
        <div class="meta-value">${escapeHtml(invoice.order_id || invoice.id || "WALK-IN")}</div>
      </div>
    </div>

    <div class="customer-card">
      <div class="section-title">BILL TO</div>
      <div style="font-size: 13px;">
        <strong>${escapeHtml(invoice.customer_name) || "Walk-in Customer"}</strong>
        ${invoice.customer_phone ? `<div>📞 ${escapeHtml(invoice.customer_phone)}</div>` : ""}
        ${invoice.customer_email ? `<div>✉️ ${escapeHtml(invoice.customer_email)}</div>` : ""}
      </div>
    </div>

    <div style="margin-bottom: 18px;">
      <table class="modern-table">
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 38%; text-align: left;">Item / Service</th>
            <th style="width: 10%; text-align: center;">Qty</th>
            <th style="width: 13%; text-align: center;">Price (₹)</th>
            <th style="width: 9%; text-align: center;">GST%</th>
            <th style="width: 10%; text-align: center;">Disc%</th>
            <th style="width: 15%; text-align: center;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${renderItemsSection()}
        </tbody>
      </table>
    </div>

    <div class="summary-payment-row">
      <div class="summary-box">
        <div class="box-title">AMOUNT SUMMARY</div>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Total Discount</span>
          <span style="color: #1f7a3a;">- ${formatCurrency(totalDiscount)}</span>
        </div>
        <div class="summary-row">
          <span>Total GST</span>
          <span>${formatCurrency(totalGST)}</span>
        </div>
        <div class="summary-row total-row">
          <span style="font-weight: 800;">GRAND TOTAL</span>
          <span>${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div class="payment-box">
        <div class="box-title">PAYMENT DETAILS</div>
        <div class="payment-line">
          <span>Amount Paid</span>
          <span class="amount-paid">${formatCurrency(paidAmount)}</span>
        </div>
        ${changeAmount > 0 ? `
          <div class="payment-line">
            <span>Change Returned</span>
            <span style="color: #1f6e3a; font-weight: 600;">${formatCurrency(changeAmount)}</span>
          </div>
        ` : ""}
        ${dueAmount > 0 ? `
          <div class="payment-line">
            <span>Due Balance</span>
            <span class="due-amount">${formatCurrency(dueAmount)}</span>
          </div>
        ` : ""}
        <div class="payment-line" style="margin-top: 8px; border-top: 1px dashed #dce4ed; padding-top: 8px;">
          <span>Payment Mode</span>
          <span>${escapeHtml(invoice.payment_mode || invoice.payment_method || "Cash / Online")}</span>
        </div>
        ${paidAmount >= totalAmount ? `<div class="payment-line" style="margin-top: 4px;"><span style="color: #1f6e3a; font-weight: 600;">✓ Payment settled</span></div>` : ""}
      </div>
    </div>

    <div class="footer-note">
      <span>This is a computer generated ${isOrderDetails ? "order summary" : "invoice"}</span>
      <span>•</span>
      <span>${isOrderDetails ? "Order" : "Invoice"} #${escapeHtml(invoice.invoice_number || invoice.id || "")}</span>
      <span>•</span>
      <span>${formatDate(invoice.created_at).split(",")[0]}</span>
    </div>
  </div>
</div>
</body>
</html>`;
};

/**
 * Generate Thermal Invoice HTML
 */
export const generateThermalInvoiceHTML = (invoice, isOrderDetails = false) => {
  if (!invoice) return "";

  const items = invoice.items || invoice.invoice_items || [];
  const subtotal = calculateSubtotal(items);
  const totalGST = calculateTotalGST(items);
  const totalDiscount = calculateTotalDiscount(items);
  const totalAmount = parseNumber(
    invoice.total_amount || invoice.totalAmount,
    subtotal - totalDiscount + totalGST,
  );
  const paidAmount = parseNumber(invoice.paid_amount || invoice.paidAmount, 0);
  const changeAmount = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const dueAmount = paidAmount < totalAmount ? totalAmount - paidAmount : 0;

  // Format date for thermal invoice
  const formatThermalDate = (date) => {
    if (!date) return new Date().toLocaleString("en-GB");
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render items
  const renderItems = () => {
    let html = "";
    if (items && items.length > 0) {
      items.forEach((item) => {
        const itemPrice = parseNumber(item.price);
        const itemTotal = parseNumber(item.total_price);
        const quantity = parseNumber(item.quantity);
        const productName =
          item.product?.name || item.product_name || item.name || "Product";
        const discount = parseNumber(item.discount);
        const gst = parseNumber(item.gst);

        html += `
      <div class="item-row">
        <div class="item-name">${truncateText(productName, 25)}${discount > 0 ? ` (-${discount}%)` : ""}${gst > 0 ? ` [+${gst}%]` : ""}</div>
        <div class="item-qty">${quantity}</div>
        <div class="item-price">${formatCurrency(itemPrice)}</div>
        <div class="item-total">${formatCurrency(itemTotal)}</div>
      </div>`;
      });
    } else {
      html += `<div style="text-align: center; padding: 10px; font-style: italic;">No items in ${isOrderDetails ? "order" : "invoice"}</div>`;
    }
    return html;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${isOrderDetails ? "Order Details" : "Thermal Invoice"} #${invoice.invoice_number || invoice.id}</title>
  <meta charset="utf-8">
  <style>
    @page { margin: 3mm 2mm; size: 80mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Fira Code', monospace;
      margin: 0;
      padding: 4px;
      background: #ffffff;
      color: #000000;
      font-size: 11px;
      line-height: 1.25;
      width: 100%;
      max-width: 80mm;
    }
    .thermal-container { width: 100%; margin: 0 auto; }
    .store-header {
      text-align: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #000;
    }
    .store-name {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .divider-double { border-top: 2px solid #000; margin: 6px 0; }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 10px;
    }
    .customer-section {
      margin: 8px 0;
      padding: 5px;
      background: #f9f9f9;
      border-left: 2px solid #000;
      font-size: 9px;
    }
    .items-header {
      display: flex;
      margin: 6px 0 4px;
      padding-bottom: 3px;
      border-bottom: 1px solid #000;
      font-weight: bold;
      font-size: 9px;
      text-transform: uppercase;
    }
    .col-item { flex: 3; text-align: left; }
    .col-qty { flex: 1; text-align: center; }
    .col-price { flex: 1.5; text-align: right; }
    .col-total { flex: 1.5; text-align: right; }
    .item-row { display: flex; margin: 3px 0; font-size: 9px; }
    .item-name { flex: 3; word-break: break-word; padding-right: 4px; }
    .item-qty { flex: 1; text-align: center; }
    .item-price { flex: 1.5; text-align: right; padding-right: 4px; }
    .item-total { flex: 1.5; text-align: right; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 10px;
    }
    .summary-total {
      font-weight: bold;
      font-size: 12px;
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #000;
    }
    .grand-total { font-size: 14px; font-weight: bold; color: #000; }
    .payment-section {
      margin: 8px 0;
      padding: 6px;
      background: #f0f0f0;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 10px;
    }
    .paid-status { color: #2d6a4f; font-weight: bold; }
    .due-status { color: #c2412c; font-weight: bold; }
    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px dashed #000;
      font-size: 8px;
      color: #555;
    }
    .thankyou {
      font-size: 10px;
      font-weight: bold;
      margin: 5px 0;
      text-transform: uppercase;
    }
    @media print {
      body { margin: 0; padding: 2px; }
    }
  </style>
</head>
<body>
<div class="thermal-container">
  <div class="store-header">
    <div class="store-name">${isOrderDetails ? "🧾 ORDER RECEIPT" : escapeHtml(invoice.store_name || "STORE")}</div>
  </div>

  <div class="info-row">
    <span>${isOrderDetails ? "ORDER #:" : "INVOICE #:"}</span>
    <span>${invoice.invoice_number || invoice.order_id || invoice.id || "N/A"}</span>
  </div>
  <div class="info-row">
    <span>${isOrderDetails ? "ORDER DATE:" : "DATE & TIME:"}</span>
    <span>${formatThermalDate(invoice.created_at)}</span>
  </div>

  <div class="divider"></div>

  <div class="customer-section">
    <div style="font-weight: bold; text-transform: uppercase; font-size: 8px; margin-bottom: 3px;">CUSTOMER</div>
    <div><strong>${invoice.customer_name ? truncateText(invoice.customer_name, 30) : "Walk-in Customer"}</strong></div>
    ${invoice.customer_phone ? `<div>${invoice.customer_phone}</div>` : ""}
  </div>

  <div class="divider"></div>

  <div class="items-header">
    <div class="col-item">ITEM</div>
    <div class="col-qty">QTY</div>
    <div class="col-price">PRICE</div>
    <div class="col-total">TOTAL</div>
  </div>

  ${renderItems()}

  <div class="divider-double"></div>

  <div style="margin: 10px 0;">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${totalDiscount > 0 ? `
      <div class="summary-row">
        <span>Discount:</span>
        <span>-${formatCurrency(totalDiscount)}</span>
      </div>
    ` : ""}
    ${totalGST > 0 ? `
      <div class="summary-row">
        <span>GST:</span>
        <span>${formatCurrency(totalGST)}</span>
      </div>
    ` : ""}
    <div class="summary-row summary-total">
      <span><strong>TOTAL AMOUNT</strong></span>
      <span class="grand-total"><strong>${formatCurrency(totalAmount)}</strong></span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="payment-section">
    <div class="payment-row">
      <span>PAID:</span>
      <span class="paid-status">${formatCurrency(paidAmount)}</span>
    </div>
    ${changeAmount > 0 ? `
      <div class="payment-row">
        <span>CHANGE:</span>
        <span>${formatCurrency(changeAmount)}</span>
      </div>
    ` : ""}
    ${dueAmount > 0 ? `
      <div class="payment-row">
        <span>DUE:</span>
        <span class="due-status">${formatCurrency(dueAmount)}</span>
      </div>
    ` : ""}
    <div class="payment-row">
      <span>MODE:</span>
      <span>${invoice.payment_mode || invoice.payment_method || "CASH"}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="footer">
    <div class="thankyou">Thank You!</div>
    <div>Visit Again</div>
    <div style="font-size: 7px; margin-top: 5px;">
      ${new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
    </div>
    ${paidAmount >= totalAmount ? '<div style="margin-top: 4px;">✅ PAID</div>' : '<div style="margin-top: 4px;">⚠️ PENDING</div>'}
  </div>
</div>
</body>
</html>`;
};

export default { generateA4InvoiceHTML, generateThermalInvoiceHTML };
