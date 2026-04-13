// utils/reportPrintHelper.js
export const generateReportHTML = (data, format = 'a4') => {
  const isA4 = format === 'a4';
  const width = isA4 ? '210mm' : '80mm';
  const padding = isA4 ? '20px' : '10px';
  const fontSize = isA4 ? '12px' : '10px';
  
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reports ${data.dateRange}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: ${fontSize};
          margin: 0;
          padding: ${padding};
          width: ${width};
          color: #333;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .store-name {
          font-size: ${isA4 ? '28px' : '18px'};
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        .report-title {
          font-size: ${isA4 ? '24px' : '16px'};
          font-weight: bold;
          margin: 20px 0;
          color: #2563eb;
        }
        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .info-item {
          flex: 1;
        }
        .info-label {
          font-size: ${isA4 ? '12px' : '10px'};
          color: #64748b;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: ${isA4 ? '16px' : '14px'};
          font-weight: 600;
          color: #1e293b;
        }
        .summary-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          flex: 1;
          min-width: ${isA4 ? '200px' : '150px'};
          padding: 15px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 10px;
          color: white;
        }
        .summary-card-title {
          font-size: ${isA4 ? '14px' : '12px'};
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .summary-card-value {
          font-size: ${isA4 ? '24px' : '18px'};
          font-weight: bold;
        }
        .reports-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .reports-table th {
          background-color: #f1f5f9;
          font-weight: 600;
          padding: 12px 8px;
          text-align: left;
          border: 1px solid #e2e8f0;
          color: #475569;
        }
        .reports-table td {
          padding: 10px 8px;
          border: 1px solid #e2e8f0;
        }
        .reports-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .text-success {
          color: #059669;
          font-weight: 600;
        }
        .text-warning {
          color: #d97706;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: ${isA4 ? '11px' : '9px'};
          color: #94a3b8;
        }
        .page-break {
          page-break-before: always;
        }
        @media print {
          body { print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${data.storeInfo.name}</div>
        <div>${data.storeInfo.address}</div>
        <div>${data.storeInfo.phone} | ${data.storeInfo.email}</div>
        <div>GST: ${data.storeInfo.gst}</div>
      </div>

      <div class="report-title">REPORTS SUMMARY</div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Report Period</div>
          <div class="info-value">${data.dateRange}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Generated On</div>
          <div class="info-value">${formatDate(data.generatedAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Report Type</div>
          <div class="info-value">${data.reportType.toUpperCase()}</div>
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-card-title">Total Reports</div>
          <div class="summary-card-value">${data.totals.totalReports}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Sales</div>
          <div class="summary-card-value">$${formatCurrency(data.totals.totalSales)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Purchases</div>
          <div class="summary-card-value">$${formatCurrency(data.totals.totalPurchases)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Profit</div>
          <div class="summary-card-value">$${formatCurrency(data.totals.totalProfit)}</div>
        </div>
      </div>

      <table class="reports-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Report ID</th>
            <th>Name</th>
            <th>Type</th>
            <th class="text-right">Amount ($)</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.reports.map((report, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${report.id || 'N/A'}</td>
              <td>${report.name || 'N/A'}</td>
              <td>
                <span style="
                  background-color: ${
                    report.type === 'sales' ? '#10b98120' :
                    report.type === 'purchases' ? '#f59e0b20' :
                    report.type === 'inventory' ? '#8b5cf620' :
                    '#3b82f620'
                  };
                  color: ${
                    report.type === 'sales' ? '#059669' :
                    report.type === 'purchases' ? '#d97706' :
                    report.type === 'inventory' ? '#6d28d9' :
                    '#2563eb'
                  };
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-weight: 500;
                ">
                  ${(report.type || 'N/A').toUpperCase()}
                </span>
              </td>
              <td class="text-right text-success">$${formatCurrency(report.amount || 0)}</td>
              <td class="text-center">
                <span style="
                  color: ${report.status === 'completed' ? '#059669' : '#d97706'};
                  font-weight: 600;
                ">
                  ${(report.status || 'N/A').toUpperCase()}
                </span>
              </td>
              <td>${formatDate(report.date)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>This is a computer generated report for ${data.dateRange}</div>
        <div>Generated by Your Store Management System</div>
        <div>© ${new Date().getFullYear()} All rights reserved</div>
      </div>
    </body>
    </html>
  `;
};