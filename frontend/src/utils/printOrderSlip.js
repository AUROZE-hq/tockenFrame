export const formatOrderType = (orderType) => {
  return orderType === 'onspot' ? 'Onspot' : 'Preorder';
};

export const formatServiceType = (serviceType) => {
  if (serviceType === 'frame') return 'Frame';
  if (serviceType === 'lamination') return 'Lamination';
  if (serviceType === 'both') return 'Frame + Lamination';
  return serviceType;
};

export const printOrderSlip = (order) => {
  // Use a hidden iframe to avoid opening a new tab
  const iframeId = 'print-order-slip-iframe';
  let iframe = document.getElementById(iframeId);
  
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    // Hide the iframe
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);
  }

  const dateStr = new Date(order.createdAt).toLocaleString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Order Slip</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 3mm;
        }
        body {
          width: 72mm;
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          color: #000;
          margin: 0;
          padding: 0;
        }
        .container {
          padding: 5px;
        }
        .header {
          text-align: center;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 5px;
        }
        .divider {
          border-bottom: 1px dashed #000;
          margin: 5px 0;
        }
        .row {
          display: flex;
          margin-bottom: 3px;
        }
        .label {
          width: 80px;
          font-weight: normal;
        }
        .value {
          flex: 1;
          font-weight: bold;
        }
        .photo-number {
          font-size: 18px;
          text-align: center;
          margin: 5px 0;
          font-weight: bold;
        }
        .footer {
          margin-top: 15px;
          border-top: 1px dashed #000;
          padding-top: 5px;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .token {
          font-size: 18px;
          font-weight: bold;
          border: 1px solid #000;
          padding: 2px 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          Coastal Creatives
        </div>
        
        <div class="photo-number">
          Photo No: ${order.photoNumber}
        </div>

        <div class="divider"></div>

        <div class="photo-number">
          Service: ${formatServiceType(order.serviceType)}
        </div>

        <div class="divider"></div>

        <div class="row">
          <div class="label">Name:</div>
          <div class="value">${order.customerName}</div>
        </div>
        <div class="row">
          <div class="label">Phone:</div>
          <div class="value">${order.phoneNumber}</div>
        </div>
        <div class="row">
          <div class="label">Order Type:</div>
          <div class="value">${formatOrderType(order.orderType)}</div>
        </div>
        <div class="row">
          <div class="label">Date:</div>
          <div class="value">${dateStr}</div>
        </div>

        <div class="footer">
          <div class="footer-content">
            <span>Thank you</span>
            <div class="token">
              ${String(order.tokenNumber || 0).padStart(3, '0')}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const printDoc = iframe.contentWindow.document;
  printDoc.open();
  printDoc.write(html);
  printDoc.close();

  // Trigger print after content is ready
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print failed:', e);
    }
  }, 250);

  return true;
};
