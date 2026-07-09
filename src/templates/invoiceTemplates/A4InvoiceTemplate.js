/**
 * A4 Invoice Template - Reusable component for generating A4 invoice HTML
 * Professional receipt-style layout optimized for printing
 */
export const generateA4InvoiceHTML = (invoice, isOrderDetails = false) => {
  if (!invoice) return "";

  // Helper function to safely parse numeric values
  const parseNumeric = (value, defaultValue = 0) => {
    if (typeof value === "string") return parseFloat(value) || defaultValue;
    if (typeof value === "number") return value;
    return defaultValue;
  };

  console.log("checking the invoice in print template", invoice);

  // Calculate totals from invoice items and packages
  const calculateSubtotal = () => {
    let subtotal = 0;
    if (Array.isArray(invoice.items)) {
      invoice.items.forEach((item) => {
        const price = parseNumeric(item.price);
        const qty = parseNumeric(item.quantity, 1);
        subtotal += price * qty;
      });
    }
    if (Array.isArray(invoice.packages)) {
      invoice.packages.forEach((pkg) => {
        const price = parseNumeric(pkg.price);
        const qty = parseNumeric(pkg.quantity, 1);
        subtotal += price * qty;
      });
    }
    return subtotal;
  };

  const calculateTotalDiscount = () => {
    let discount = 0;
    if (Array.isArray(invoice.items)) {
      invoice.items.forEach((item) => {
        const price = parseNumeric(item.price);
        const qty = parseNumeric(item.quantity, 1);
        const discPercent = parseNumeric(item.discount);
        const subtotal = price * qty;
        discount += subtotal * (discPercent / 100);
      });
    }
    return discount;
  };

  const calculateTotalGST = () => {
    let gst = 0;
    if (Array.isArray(invoice.items)) {
      invoice.items.forEach((item) => {
        const price = parseNumeric(item.price);
        const qty = parseNumeric(item.quantity, 1);
        const discPercent = parseNumeric(item.discount);
        const gstPercent = parseNumeric(item.gst);
        const subtotal = price * qty;
        const afterDisc = subtotal - (subtotal * discPercent) / 100;
        gst += afterDisc * (gstPercent / 100);
      });
    }
    return gst;
  };

  const subtotal = calculateSubtotal();
  const totalDiscount = calculateTotalDiscount();
  const totalGST = calculateTotalGST();
  const totalAmount = parseNumeric(
    invoice.total_amount || invoice.totalAmount,
    subtotal - totalDiscount + totalGST,
  );
  const paidAmount = parseNumeric(invoice.paid_amount || invoice.paidAmount, 0);
  const changeAmount = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const dueAmount = paidAmount < totalAmount ? totalAmount - paidAmount : 0;

  // Format currency
  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

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

  // Render header conditionally
  const renderHeader = () => {
    if (isOrderDetails) return "";

    if (invoice.store_name === "Store Deleted") {
      return `
        <div class="header-row">
          <div class="brand-section">
            <div class="store-deleted-badge">
              <div class="store-deleted-title">STORE DELETED</div>
              <div class="store-deleted-sub">Store information is no longer available</div>
            </div>
          </div>
          <div class="invoice-badge">
            <h2>TAX INVOICE</h2>
            <p>Original for Recipient</p>
          </div>
        </div>`;
    }

    return `
      <div class="header-row">
        <div class="brand-section">
          <div style="display:flex;gap:7px;">
          <div>${invoice.store?.logo ? `<div class="store-logo"><img src="${invoice.store.logo}" alt="Store Logo"/></div>` : ""}</div>
          <div>
           <div class="brand-name">${escapeHtml(invoice.store_name) || "Store"}</div>
          <div class="store-meta">
            ${escapeHtml(invoice.store_address) || ""}<br>
            ${invoice.store_phone ? `📞 ${escapeHtml(invoice.store_phone)}` : ""}
            ${invoice.store_email ? `&nbsp;| ✉️ ${escapeHtml(invoice.store_email)}` : ""}
            ${invoice.store_gst ? `<br>GST: ${escapeHtml(invoice.store_gst)}` : ""}
          </div>
          </div>

          </div>
         
        </div>
        <div class="invoice-badge">
          <h2>TAX INVOICE</h2>
          <p>Original for Recipient</p>
        </div>
      </div>`;
  };

  // Helper function to format attributes
  const formatAttributes = (attributes) => {
    if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
      return "";
    }
    
    const attrStrings = attributes.map(attr => {
      if (typeof attr === 'object') {
        const entries = Object.entries(attr);
        return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
      }
      return String(attr);
    });
    
    return attrStrings.join(' | ');
  };

  // Helper function to get variant information (without unit since it's shown with quantity)
  const getVariantInfo = (item) => {
    if (!item.product) return "";
    
    const product = item.product;
    const variantParts = [];
    
    // Add SKU if available
    if (product.sku) {
      variantParts.push(`SKU: ${product.sku}`);
    }
    
    return variantParts.join(' • ');
  };

  // Render items section with brand, category, attributes and variants
  function renderItemsSection(invoice) {
    let html = "";

    // Determine which items array to use
    const items = invoice.invoice_items || invoice.items || [];
    
    console.log("checking the invoice items", items);

    // Products
    if (Array.isArray(items) && items.length > 0) {
      html += `<tr><td colspan="7" class="section-header">🛒 PRODUCTS</td></tr>`;
      
      items.forEach((item, idx) => {
        const price = parseNumeric(item.price);
        const qty = parseNumeric(item.quantity, 1);
        const total = parseNumeric(item.total_price, price * qty);
        const gst = parseNumeric(item.gst);
        const discount = parseNumeric(item.discount);
        
        // Get product name
        let productName = item.product?.name || item.product_name || item.name || "Product";
        
        // Build product details with brand, category, attributes, and variants
        const productDetails = [];
        
        // Add brand (only from product.brand)
        if (item.product?.brand?.name) {
          productDetails.push(`<span class="product-brand">${escapeHtml(item.product.brand.name)}</span>`);
        }
        
        // Add category (only from product.category)
        if (item.product?.category?.name) {
          productDetails.push(`<span class="product-category">${escapeHtml(item.product.category.name)}</span>`);
        }
        
        // Add attributes from product.attributes
        if (item.product?.attributes && Array.isArray(item.product.attributes) && item.product.attributes.length > 0) {
          const formattedAttrs = formatAttributes(item.product.attributes);
          if (formattedAttrs) {
            productDetails.push(`<span class="product-attributes">${escapeHtml(formattedAttrs)}</span>`);
          }
        }
        
        // Add variant info (SKU only - no unit since it's shown with quantity)
        const variantInfo = getVariantInfo(item);
        if (variantInfo) {
          productDetails.push(`<span class="product-variant">${escapeHtml(variantInfo)}</span>`);
        }

        // Build the product display name with all details
        let displayName = escapeHtml(productName);
        if (productDetails.length > 0) {
          displayName += `<br><span style="font-size: 10px; color: #4d637a; font-weight: 400;">${productDetails.join(' • ')}</span>`;
        }

        html += `<tr>
          <td style="text-align: left; vertical-align: middle;">${idx + 1}</td>
          <td style="text-align: left; vertical-align: middle;">${displayName}</td>
          <td style="text-align: center; vertical-align: middle;">${qty} ${item.product?.unit?.code || ''}</td>
          <td style="text-align: center; vertical-align: middle;">${formatCurrency(price)}</td>
          <td style="text-align: center; vertical-align: middle;">${gst > 0 ? `${gst}%` : "—"}</td>
          <td style="text-align: center; vertical-align: middle;">${discount > 0 ? `${discount}%` : "—"}</td>
          <td style="text-align: center; font-weight: 600; vertical-align: middle;">${formatCurrency(total)}</td>
        </tr>`;
      });
    }

    // Packages - keep this separate if packages exist
    if (Array.isArray(invoice.packages) && invoice.packages.length > 0) {
      html += `<tr><td colspan="7" class="section-header" style="background: #eef3f9 !important;">📦 PACKAGES</td></tr>`;
      invoice.packages.forEach((pkg, idx) => {
        const price = parseNumeric(pkg.price);
        const qty = parseNumeric(pkg.quantity, 1);
        const total = parseNumeric(pkg.total_price, price * qty);
        const packageName =
          pkg.package_name || pkg.name || pkg.product_name || "Package";

        html += `<tr>
          <td style="text-align: left; vertical-align: middle;">${idx + 1}</td>
          <td style="text-align: left; vertical-align: middle;">${escapeHtml(packageName)}</td>
          <td style="text-align: center; vertical-align: middle;">${qty}</td>
          <td style="text-align: center; vertical-align: middle;">${formatCurrency(price)}</td>
          <td style="text-align: center; vertical-align: middle;">—</td>
          <td style="text-align: center; vertical-align: middle;">—</td>
          <td style="text-align: center; font-weight: 600; vertical-align: middle;">${formatCurrency(total)}</td>
        </tr>`;
      });
    }

    // No items
    const allItems = [...(items || []), ...(invoice.packages || [])];
    if (allItems.length === 0) {
      html += `<tr><td colspan="7" style="text-align: center; padding: 28px; color: #8aa0b5;">No items found</td></tr>`;
    }

    return html;
  }

  // Helper function to escape HTML
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isOrderDetails ? "Order Details" : "Invoice #"}${invoice.invoice_number || invoice.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 0.8cm 0.8cm;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      background: #f0f2f5;
      display: flex;
      justify-content: center;
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

    .invoice-container {
      padding: 30px 35px 25px;
    }

    /* ===== HEADER ===== */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 2px solid #e8edf3;
    }

    .brand-section {
      flex: 1;
    }

    .store-logo {
      margin-bottom: 6px;
      border-radius:10px;
       overflow:hidden;
       width:100px;
       height:100px;
       max-width:100px;
       max-height:100px;
    }

    .store-logo img {
      width:100%;
      height:100%;
      object-fit: cover;
     
    }

    .brand-name {
      font-size: 24px;
      font-weight: 700;
      color: #0b1a2a;
      letter-spacing: -0.3px;
      margin-bottom: 4px;
    }

    .store-meta {
      font-size: 12.5px;
      color: #4d637a;
      line-height: 1.5;
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
      letter-spacing: 1.2px;
      margin: 0;
    }

    .invoice-badge p {
      font-size: 10px;
      color: #55708b;
      margin-top: 3px;
      font-weight: 500;
    }

    /* Store deleted badge */
    .store-deleted-badge {
      display: inline-block;
      padding: 12px 20px;
      border: 2px dashed #b0bcc9;
      border-radius: 8px;
      background: #f7f9fc;
      text-align: center;
    }

    .store-deleted-title {
      font-size: 18px;
      font-weight: 700;
      color: #4a5b6e;
      letter-spacing: 0.5px;
    }

    .store-deleted-sub {
      font-size: 11px;
      color: #7a8b9e;
      margin-top: 2px;
    }

    /* ===== META INFO ===== */
    .meta-grid {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px 20px;
      background: #f7faff;
      padding: 12px 18px;
      border-radius: 10px;
      margin-bottom: 16px;
      border: 1px solid #eef3f9;
    }

    .meta-block {
      flex: 1;
      min-width: 120px;
    }

    .meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #6f859d;
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #142433;
    }

    /* ===== CUSTOMER ===== */
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
      letter-spacing: 0.8px;
      color: #4a6a88;
      margin-bottom: 6px;
      border-left: 3px solid #2b7ba8;
      padding-left: 10px;
    }

    .customer-details-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 24px;
    }

    .customer-field {
      font-size: 13px;
      color: #1f3347;
    }

    .customer-field strong {
      font-weight: 600;
      color: #0d2137;
    }

    .gst-chip {
      background: #e9f0f8;
      padding: 1px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: #1f4a6b;
    }

    /* ===== ITEMS TABLE ===== */
    .items-section {
      margin-bottom: 18px;
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
      letter-spacing: 0.4px;
      text-align: center;
      border: none;
    }

    .modern-table th:first-child {
      text-align: left;
    }

    .modern-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #eef2f7;
      color: #1d3143;
      text-align: center;
    }

    .modern-table td:first-child {
      text-align: left;
    }

    .modern-table td:nth-child(2) {
      text-align: left;
    }

    .modern-table tr:last-child td {
      border-bottom: none;
    }

    .modern-table tr:hover td {
      background: #f8fafd;
    }

    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .fw-semibold {
      font-weight: 600;
    }

    .section-header {
      background: #f2f6fc !important;
      padding: 5px 12px !important;
      font-weight: 700;
      font-size: 11px;
      color: #1f405d;
      letter-spacing: 0.4px;
    }

    .section-header td {
      background: #f2f6fc !important;
    }

    /* Product detail styles */
    .product-brand {
      color: #1f6e3a;
      font-weight: 500;
    }
    
    .product-category {
      color: #2b7ba8;
      font-weight: 500;
    }
    
    .product-attributes {
      color: #8a6d3b;
      font-weight: 400;
    }
    
    .product-variant {
      color: #4d637a;
      font-weight: 400;
    }

    /* ===== SUMMARY & PAYMENT ===== */
    .summary-payment-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .summary-box,
    .payment-box {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e6ecf3;
      border-radius: 12px;
      padding: 14px 18px;
      min-width: 200px;
    }

    .summary-box {
      background: #f9fcff;
    }

    .payment-box {
      background: #f8fafd;
    }

    .box-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
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

    .summary-row .label {
      color: #56708a;
    }

    .summary-row .value {
      font-weight: 500;
      color: #1d3145;
    }

    .total-row {
      margin-top: 6px;
      padding-top: 8px;
      border-top: 2px solid #dfe6ef;
      font-weight: 800;
      font-size: 16px;
    }

    .total-row .value {
      color: #165a7a;
      font-size: 18px;
    }

    .payment-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
      color: #1d3347;
    }

    .amount-paid {
      font-weight: 700;
      color: #1f6e3a;
    }

    .due-amount {
      color: #b53b2a;
      font-weight: 700;
    }

    .payment-settled {
      color: #1f6e3a;
      font-weight: 600;
      font-size: 12px;
    }

    /* ===== QR CODE FOOTER ===== */
    .qr-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 2px solid #e8edf3;
    }

    .qr-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .qr-code-img {
      max-width: 100px;
      max-height: 100px;
      border: 1px solid #e6ecf3;
      border-radius: 8px;
      padding: 4px;
      background: white;
    }

    .qr-label {
      font-size: 11px;
      color: #4d657e;
      font-weight: 500;
    }

    .footer-text {
      text-align: right;
      font-size: 11px;
      color: #748aa1;
      line-height: 1.5;
    }

    .footer-text strong {
      color: #1f3b55;
    }

    /* ===== BOTTOM FOOTER ===== */
    .footer-note {
      margin-top: 14px;
      text-align: center;
      border-top: 1px solid #e8edf3;
      padding-top: 12px;
      font-size: 10.5px;
      color: #7f94ab;
      letter-spacing: 0.2px;
    }

    .footer-note span {
      margin: 0 12px;
    }

    /* ===== PRINT ===== */
    @media print {
      body {
        background: white;
        padding: 0;
        margin: 0;
      }
      .invoice-wrapper {
        box-shadow: none;
        border-radius: 0;
        max-width: 100%;
      }
      .invoice-container {
        padding: 0.3cm 0.4cm;
      }
      .modern-table tr:hover td {
        background: transparent;
      }
      .meta-grid,
      .customer-card,
      .summary-box,
      .payment-box,
      .items-section {
        break-inside: avoid;
      }
    }

    @media (max-width: 700px) {
      .invoice-container {
        padding: 16px;
      }
      .header-row {
        flex-direction: column;
        align-items: stretch;
      }
      .invoice-badge {
        text-align: center;
        align-self: stretch;
      }
      .meta-grid {
        flex-direction: column;
        gap: 6px;
      }
      .summary-payment-row {
        flex-direction: column;
      }
      .qr-footer {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .footer-text {
        text-align: center;
      }
      .qr-section {
        flex-direction: column;
        align-items: center;
      }
    }
  </style>
</head>
<body>
<div class="invoice-wrapper">
  <div class="invoice-container">
    ${renderHeader()}

    <!-- Meta Info -->
    <div class="meta-grid">
      <div class="meta-block">
        <div class="meta-label">${isOrderDetails ? "Order Number" : "Invoice Number"}</div>
        <div class="meta-value">#${escapeHtml(invoice.invoice_number || invoice.id || "INV-001")}</div>
      </div>
      <div class="meta-block">
        <div class="meta-label">${isOrderDetails ? "Order Date" : "Invoice Date"}</div>
        <div class="meta-value">${formatDate(invoice.created_at)}</div>
      </div>
    </div>

    <!-- Customer Details -->
    <div class="customer-card">
      <div class="section-title">BILL TO</div>
      <div class="customer-details-inline">
        <div class="customer-field"><strong>${escapeHtml(invoice.customer_name) || "Walk-in Customer"}</strong></div>
        ${invoice.customer_phone ? `<div class="customer-field">📞 ${escapeHtml(invoice.customer_phone)}</div>` : ""}
        ${invoice.customer_email ? `<div class="customer-field">✉️ ${escapeHtml(invoice.customer_email)}</div>` : ""}
        ${invoice.customer_address ? `<div class="customer-field">📍 ${escapeHtml(invoice.customer_address)}</div>` : ""}
        ${invoice.customer_gst ? `<div class="customer-field"><span class="gst-chip">GST: ${escapeHtml(invoice?.customer?.gst_number)}</span></div>` : ""}
      </div>
    </div>

    <!-- Items Table -->
    <div class="items-section">
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
          ${renderItemsSection(invoice)}
        </tbody>
      </table>
    </div>

    <!-- Summary & Payment Row -->
    <div class="summary-payment-row">
      <div class="summary-box">
        <div class="box-title">AMOUNT SUMMARY</div>
        <div class="summary-row">
          <span class="label">Subtotal</span>
          <span class="value">${formatCurrency(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Total Discount</span>
          <span class="value" style="color: #1f7a3a;">- ${formatCurrency(totalDiscount)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Total GST</span>
          <span class="value">${formatCurrency(totalGST)}</span>
        </div>
        <div class="summary-row total-row">
          <span class="label" style="font-weight: 800;">GRAND TOTAL</span>
          <span class="value">${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div class="payment-box">
        <div class="box-title">PAYMENT DETAILS</div>
        <div class="payment-line">
          <span>Amount Paid</span>
          <span class="amount-paid">${formatCurrency(paidAmount)}</span>
        </div>
        ${
          changeAmount > 0
            ? `
          <div class="payment-line">
            <span>Change Returned</span>
            <span style="color: #1f6e3a; font-weight: 600;">${formatCurrency(changeAmount)}</span>
          </div>
        `
            : ""
        }
        ${
          dueAmount > 0
            ? `
          <div class="payment-line">
            <span>Due Balance</span>
            <span class="due-amount">${formatCurrency(dueAmount)}</span>
          </div>
        `
            : ""
        }
        <div class="payment-line" style="margin-top: 8px; border-top: 1px dashed #dce4ed; padding-top: 8px;">
          <span>Payment Mode</span>
          <span>${escapeHtml(invoice.payment_mode || invoice.payment_method || "Cash / Online")}</span>
        </div>
        ${invoice.transaction_id ? `<div class="payment-line" style="font-size: 12px;"><span>Txn ID</span><span>${escapeHtml(invoice.transaction_id)}</span></div>` : ""}
        ${paidAmount >= totalAmount ? `<div class="payment-line" style="margin-top: 4px;"><span class="payment-settled">✓ Payment settled</span><span></span></div>` : ""}
      </div>
    </div>

    <!-- QR Code Footer -->
    <div style="display:flex !important;justify-content:flex-end !important;align-items:center !important;margin-top:20px !important;">
  ${
    invoice.store?.bank_qr
      ? `
    <div style="
      width:120px !important;
      text-align:center !important;
    ">
      
      <div style="
        font-size:12px !important;
        font-weight:600 !important;
        color:#1f2937 !important;
        margin-bottom:10px !important;
        letter-spacing:0.5px !important;
      ">
        PAYMENT QR
      </div>

      <div style="
        width:120px !important;
        height:120px !important;
        margin:0 auto 10px auto !important;
        border:1px solid #e5e7eb !important;
        border-radius:8px !important;
        padding:6px !important;
        background:#fff !important;
      ">
        <img
          src="${invoice.store.bank_qr}"
          alt="QR Code"
          style="
            width:100% !important;
            height:100% !important;
            object-fit:contain !important;
            display:block !important;
          "
        />
      </div>

      <div style="
        font-size:13px !important;
        font-weight:600 !important;
        color:#111827 !important;
        margin-bottom:4px !important;
        text-align:center !important;
      ">
        Scan to Pay
      </div>

      <div style="
        font-size:10px !important;
        color:#6b7280 !important;
        line-height:1.4 !important;
        text-align:center !important;
      ">
        UPI / Bank Transfer
      </div>

    </div>
  `
      : `
    <div></div>
  `
  }
</div>

    <!-- Bottom Footer -->
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

export default generateA4InvoiceHTML;