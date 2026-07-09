/**
 * Thermal Invoice Template - Reusable component for generating 3-inch thermal invoice HTML
 * Professional receipt-style layout optimized for 58mm/80mm thermal paper
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

// Calculate totals from invoice items
const calculateSubtotal = (items, packages) => {
  let subtotal = 0;

  if (items && Array.isArray(items)) {
    subtotal += items.reduce((sum, item) => {
      const price = parseNumber(item.price);
      const quantity = parseNumber(item.quantity);
      return sum + (price * quantity);
    }, 0);
  }

  if (packages && Array.isArray(packages)) {
    subtotal += packages.reduce((sum, pkg) => {
      const price = parseNumber(pkg.price);
      const quantity = parseNumber(pkg.quantity);
      return sum + (price * quantity);
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

const calculateGrandTotal = (invoice, subtotal, totalGST, totalDiscount) => {
  if (invoice.total_amount) return parseNumber(invoice.total_amount);
  if (invoice.totalAmount) return parseNumber(invoice.totalAmount);
  return subtotal - totalDiscount + totalGST;
};

export const generateThermalInvoiceHTML = (invoice, isOrderDetails = false) => {
  if (!invoice) return "";

  // Get items from the correct source
  const items = invoice.items || invoice.invoice_items || [];
  const packages = invoice.packages || [];

  console.log("Items found:", items.length);
  console.log("First item:", items[0]);

  const subtotal = calculateSubtotal(items, packages);
  const totalGST = calculateTotalGST(items);
  const totalDiscount = calculateTotalDiscount(items);
  const totalAmount = calculateGrandTotal(
    invoice,
    subtotal,
    totalGST,
    totalDiscount,
  );
  const paidAmount = parseNumber(invoice.paid_amount || invoice.paidAmount);
  const changeAmount = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const dueAmount = paidAmount < totalAmount ? totalAmount - paidAmount : 0;

  // Format date for thermal invoice
  const formatDate = (date) => {
    if (!date) return new Date().toLocaleString("en-GB");
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get unit code
  const getUnitCode = (item) => {
    if (item.product?.unit?.code) return item.product.unit.code;
    if (item.unit_code) return item.unit_code;
    if (item.unit?.code) return item.unit.code;
    if (item.product?.unit_code) return item.product.unit_code;
    return "";
  };

  // Render store header
  const renderStoreHeader = () => {
    if (isOrderDetails) {
      return `
      <div style="text-align: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #000;">
        <div style="font-size: 16px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          🧾 ORDER RECEIPT
        </div>
        <div style="font-size: 9px; color: #555; margin-top: 2px;">
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>
      </div>
    `;
    }

    if (invoice.store_name === "Store Deleted") {
      return `
      <div style="text-align:center; margin-bottom:10px; padding:8px; border:1px dashed #999; background:#f8f8f8;">
        <div style="font-size:16px; font-weight:700; color:#444;">STORE DELETED</div>
        <div style="font-size:9px; color:#777;">Original store information unavailable</div>
      </div>
    `;
    }

    let logoHTML = "";
    if (invoice.store?.logo) {
      logoHTML = `
        <div style="text-align: center; margin-bottom: 4px;">
          <img src="${invoice.store.logo}" alt="Store Logo" style="max-width:70px; max-height:50px; display:inline-block;"/>
        </div>
      `;
    }

    return `
    <div style="text-align: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #000;">
      ${logoHTML}
      <div style="font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${invoice.store_name || ""}</div>
      <div style="font-size: 8px; color: #333; line-height: 1.4; margin-top: 2px;">
        ${invoice.store_address || ""}
        ${invoice.store_phone ? `<br>Tel: ${invoice.store_phone}` : ""}
        ${invoice.store_email ? ` | Email: ${invoice.store_email}` : ""}
        ${invoice.store_gst ? `<br>GST: ${invoice.store_gst}` : ""}
      </div>
    </div>
  `;
  };

  // Render QR code
  const renderQRCode = () => {
    if (!invoice.store?.bank_qr) return "";

    return `
      <div style="text-align: center; margin: 6px 0; padding: 4px; border: 1px dashed #999;">
        <div style="font-size: 7px; font-weight: bold; letter-spacing: 0.5px; color: #333;">SCAN TO PAY</div>
        <img src="${invoice.store.bank_qr}" alt="QR" style="max-width:80px; max-height:80px; display:inline-block; padding:2px; background:white;"/>
        <div style="font-size: 6px; color: #666;">UPI / Bank Transfer</div>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${isOrderDetails ? "Order" : "Invoice"} #${invoice.invoice_number || invoice.id}</title>
  <meta charset="utf-8">
  <style>
    @page {
      margin: 2mm 2mm;
      size: 76mm auto;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', 'Fira Code', monospace;
      margin: 0;
      padding: 3px;
      background: #ffffff;
      color: #000000;
      font-size: 9px;
      line-height: 1.3;
      width: 100%;
      max-width: 76mm;
    }
    
    .receipt {
      width: 100%;
      margin: 0 auto;
      padding: 2px;
    }
    
    /* Divider styles */
    .dash {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    
    .solid {
      border-top: 2px solid #000;
      margin: 4px 0;
    }
    
    .double {
      border-top: 3px double #000;
      margin: 4px 0;
    }
    
    /* Info rows */
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      font-size: 8px;
    }
    
    .info-label {
      color: #444;
    }
    
    .info-value {
      font-weight: bold;
    }
    
    /* Customer section */
    .customer-box {
      margin: 4px 0;
      padding: 4px 6px;
      background: #f7f7f7;
      border-left: 2px solid #000;
      font-size: 8px;
    }
    
    .customer-label {
      font-weight: bold;
      font-size: 7px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    /* Items table */
    .items-header {
      display: flex;
      margin: 4px 0 2px;
      padding: 2px 0;
      border-bottom: 1px solid #000;
      font-weight: bold;
      font-size: 7px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .col-item { flex: 2.5; text-align: left; }
    .col-qty { flex: 0.8; text-align: center; }
    .col-price { flex: 1.2; text-align: right; }
    .col-gst { flex: 0.8; text-align: center; }
    .col-disc { flex: 0.8; text-align: center; }
    .col-total { flex: 1.2; text-align: right; }
    
    .item-row {
      display: flex;
      padding: 2px 0;
      font-size: 8px;
      border-bottom: 1px dotted #eee;
    }
    
    .item-name {
      flex: 2.5;
      word-break: break-word;
      padding-right: 3px;
      font-weight: 500;
    }
    
    .item-name-details {
      font-size: 6px;
      color: #555;
      font-weight: normal;
      display: block;
    }
    
    .item-qty { flex: 0.8; text-align: center; }
    .item-price { flex: 1.2; text-align: right; padding-right: 2px; }
    .item-gst { flex: 0.8; text-align: center; font-size: 7px; color: #555; }
    .item-disc { flex: 0.8; text-align: center; font-size: 7px; color: #555; }
    .item-total { flex: 1.2; text-align: right; font-weight: 600; }
    
    .package-row {
      background: #f5f5f5;
      padding: 2px 0;
      margin: 1px 0;
    }
    
    /* Tags */
    .tag {
      display: inline-block;
      font-size: 6px;
      padding: 0 3px;
      margin: 1px 1px 1px 0;
      border-radius: 2px;
    }
    
    .tag-brand { background: #e8f5e9; color: #2e7d32; }
    .tag-category { background: #e3f2fd; color: #1565c0; }
    .tag-sku { background: #f5f5f5; color: #616161; }
    .tag-attribute { background: #fff3e0; color: #e65100; }
    
    /* Summary */
    .summary {
      margin: 6px 0 4px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      font-size: 8px;
    }
    
    .summary-total {
      font-weight: bold;
      font-size: 11px;
      margin-top: 3px;
      padding-top: 3px;
      border-top: 2px solid #000;
    }
    
    .grand-total {
      font-size: 13px;
      font-weight: bold;
    }
    
    /* Payment */
    .payment-box {
      margin: 4px 0;
      padding: 4px 6px;
      background: #f5f5f5;
    }
    
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      font-size: 8px;
    }
    
    .paid { color: #2d6a4f; font-weight: bold; }
    .due { color: #c2412c; font-weight: bold; }
    
    /* Footer */
    .footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 4px;
      border-top: 1px dashed #000;
      font-size: 7px;
      color: #555;
    }
    
    .thankyou {
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 3px 0;
    }
    
    @media print {
      body { margin: 0; padding: 1px; }
      .item-row { border-bottom: 1px dotted #ddd; }
    }
    
    @media (max-width: 60mm) {
      body { font-size: 7px; }
      .item-name { font-size: 7px; }
      .item-name-details { font-size: 5px; }
      .tag { font-size: 5px; padding: 0 2px; }
    }
  </style>
</head>
<body>
<div class="receipt">
  
  ${renderStoreHeader()}

  <!-- Invoice Info -->
  <div style="margin: 4px 0;">
    <div class="info-row">
      <span class="info-label">${isOrderDetails ? "ORDER #" : "INVOICE #"}</span>
      <span class="info-value">${invoice.invoice_number || invoice.id || "N/A"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">${isOrderDetails ? "ORDER DATE" : "DATE"}</span>
      <span class="info-value">${formatDate(invoice.created_at)}</span>
    </div>
    ${invoice.order_id ? `
    <div class="info-row">
      <span class="info-label">ORDER #</span>
      <span class="info-value">${invoice.order_id}</span>
    </div>
    ` : ""}
  </div>

  <div class="dash"></div>

  <!-- Customer -->
  <div class="customer-box">
    <div class="customer-label">Customer</div>
    <div><strong>${invoice.customer_name || "Walk-in Customer"}</strong></div>
    ${invoice.customer_phone ? `<div>${invoice.customer_phone}</div>` : ""}
    ${invoice.customer_email ? `<div style="font-size:7px;">${invoice.customer_email}</div>` : ""}
    ${invoice.customer_gst ? `<div>GST: ${invoice?.customer?.gst_number || invoice.customer_gst}</div>` : ""}
  </div>

  <div class="dash"></div>

  <!-- Items Header -->
  <div class="items-header">
    <div class="col-item">ITEM</div>
    <div class="col-qty">QTY</div>
    <div class="col-price">PRICE</div>
    <div class="col-gst">GST%</div>
    <div class="col-disc">DISC%</div>
    <div class="col-total">TOTAL</div>
  </div>

  <!-- Products -->
  ${items && items.length > 0 ? items.map((item, index) => {
    // Calculate values properly
    const itemPrice = parseNumber(item.price);
    const quantity = parseNumber(item.quantity);
    // Calculate total from price * quantity (since total_price might not exist)
    const itemTotal = itemPrice * quantity;
    const unitCode = getUnitCode(item);
    const gst = parseNumber(item.gst);
    const discount = parseNumber(item.discount);
    
    const productName = item.product?.name || item.product_name || item.name || "Product";
    const productDetails = [];
    
    if (item.product?.brand?.name) {
      productDetails.push(`<span class="tag tag-brand">${item.product.brand.name}</span>`);
    }
    if (item.product?.category?.name) {
      productDetails.push(`<span class="tag tag-category">${item.product.category.name}</span>`);
    }
    if (item.product?.attributes && Array.isArray(item.product.attributes) && item.product.attributes.length > 0) {
      const formattedAttrs = formatAttributes(item.product.attributes);
      if (formattedAttrs) {
        productDetails.push(`<span class="tag tag-attribute">${formattedAttrs}</span>`);
      }
    }
    if (item.product?.sku) {
      productDetails.push(`<span class="tag tag-sku">SKU: ${item.product.sku}</span>`);
    }
    
    const detailsHTML = productDetails.length > 0 
      ? `<span class="item-name-details">${productDetails.join(' ')}</span>` 
      : '';

    return `
    <div class="item-row">
      <div class="item-name">
        ${productName}
        ${detailsHTML}
      </div>
      <div class="item-qty">${quantity}${unitCode ? unitCode : ""}</div>
      <div class="item-price">${formatCurrency(itemPrice)}</div>
      <div class="item-gst">${gst > 0 ? gst + '%' : '—'}</div>
      <div class="item-disc">${discount > 0 ? discount + '%' : '—'}</div>
      <div class="item-total">${formatCurrency(itemTotal)}</div>
    </div>
  `}).join("") : ""}

  <!-- Packages -->
  ${packages && packages.length > 0 ? `
    <div style="font-weight:bold; font-size:7px; margin:3px 0; text-transform:uppercase; letter-spacing:0.3px;">📦 Packages</div>
    ${packages.map((pkg) => {
      const pkgPrice = parseNumber(pkg.price);
      const quantity = parseNumber(pkg.quantity);
      const pkgTotal = pkgPrice * quantity;
      const packageName = pkg.package_name || pkg.name || pkg.product_name || "Package";
      const unitCode = getUnitCode(pkg);

      return `
      <div class="item-row package-row">
        <div class="item-name">📦 ${packageName}</div>
        <div class="item-qty">${quantity}${unitCode ? unitCode : ""}</div>
        <div class="item-price">${formatCurrency(pkgPrice)}</div>
        <div class="item-gst">—</div>
        <div class="item-disc">—</div>
        <div class="item-total">${formatCurrency(pkgTotal)}</div>
      </div>
    `}).join("")}
  ` : ""}

  <!-- No items -->
  ${(!items || items.length === 0) && (!packages || packages.length === 0) ? `
    <div style="text-align:center; padding:10px; font-style:italic; color:#999;">No items</div>
  ` : ""}

  <div class="solid"></div>

  <!-- Summary -->
  <div class="summary">
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${totalDiscount > 0 ? `
    <div class="summary-row">
      <span style="color:#2d6a4f;">Discount</span>
      <span style="color:#2d6a4f;">-${formatCurrency(totalDiscount)}</span>
    </div>
    ` : ""}
    ${totalGST > 0 ? `
    <div class="summary-row">
      <span>GST</span>
      <span>${formatCurrency(totalGST)}</span>
    </div>
    ` : ""}
    <div class="summary-row summary-total">
      <span><strong>TOTAL</strong></span>
      <span class="grand-total"><strong>${formatCurrency(totalAmount)}</strong></span>
    </div>
  </div>

  <div class="dash"></div>

  <!-- Payment -->
  <div class="payment-box">
    <div class="payment-row">
      <span>Paid</span>
      <span class="paid">${formatCurrency(paidAmount)}</span>
    </div>
    ${changeAmount > 0 ? `
    <div class="payment-row">
      <span>Change</span>
      <span>${formatCurrency(changeAmount)}</span>
    </div>
    ` : ""}
    ${dueAmount > 0 ? `
    <div class="payment-row">
      <span>Due</span>
      <span class="due">${formatCurrency(dueAmount)}</span>
    </div>
    ` : ""}
    <div class="payment-row">
      <span>Mode</span>
      <span>${invoice.payment_mode || invoice.payment_method || "CASH"}</span>
    </div>
    ${invoice.transaction_id ? `
    <div class="payment-row" style="font-size:7px;">
      <span>Txn ID</span>
      <span>${invoice.transaction_id}</span>
    </div>
    ` : ""}
    <div class="payment-row" style="margin-top:2px; padding-top:2px; border-top:1px dashed #ccc; font-size:7px; font-weight:bold;">
      <span>Status</span>
      <span>${paidAmount >= totalAmount ? '✅ PAID' : '⚠️ PENDING'}</span>
    </div>
  </div>

  <div class="dash"></div>

  <!-- QR Code -->
  ${renderQRCode()}
  ${renderQRCode() ? '<div class="dash"></div>' : ""}

  <!-- Footer -->
  <div class="footer">
    <div class="thankyou">Thank You!</div>
    <div style="font-size:8px;">Visit Again</div>
    <div style="font-size:6px; margin-top:3px; color:#888;">
      ${invoice.store_email || ""}
      ${invoice.store_email ? '<br>' : ''}
      ${new Date().toLocaleString("en-GB", { 
        hour: "2-digit", 
        minute: "2-digit",
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric" 
      })}
    </div>
  </div>
  
</div>
</body>
</html>`;
};

export default generateThermalInvoiceHTML;