// Mock invoices data and functions
let mockInvoicesList = [
  {
    id: 1,
    user_id: 1,
    customer_id: 1,
    store_id: 1,
    invoice_number: 'INV-001',
    total_amount: 359.96,
    paid_amount: 359.96,
    due_amount: 0,
    status: 'paid',
    created_by: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: 1,
        invoice_id: 1,
        product_id: 1,
        quantity: 5,
        unit_id: 1,
        price: 29.99,
        gst: 5,
        discount: 0,
        total_price: 149.95,
        status: 'completed',
      },
      {
        id: 2,
        invoice_id: 1,
        product_id: 2,
        quantity: 2,
        unit_id: 1,
        price: 79.99,
        gst: 5,
        discount: 10,
        total_price: 143.98,
        status: 'completed',
      },
    ],
  },
  {
    id: 2,
    user_id: 1,
    customer_id: 2,
    store_id: 1,
    invoice_number: 'INV-002',
    total_amount: 239.94,
    paid_amount: 200.00,
    due_amount: 39.94,
    status: 'partial',
    created_by: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: 3,
        invoice_id: 2,
        product_id: 1,
        quantity: 8,
        unit_id: 1,
        price: 29.99,
        gst: 5,
        discount: 0,
        total_price: 239.92,
        status: 'completed',
      },
    ],
  },
];

let mockPayments = [
  {
    id: 1,
    invoice_id: 1,
    amount: 359.96,
    payment_method: 'cash',
    payment_date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Full payment received',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    invoice_id: 2,
    amount: 200.00,
    payment_method: 'card',
    payment_date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Partial payment',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockInvoices = {
  get: async (endpoint, params = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (endpoint === '/invoice/bill-history') {
      let filteredInvoices = [...mockInvoicesList];
      
      // Apply filters
      if (params.customer_id) {
        filteredInvoices = filteredInvoices.filter(i => i.customer_id == params.customer_id);
      }
      if (params.store_id) {
        filteredInvoices = filteredInvoices.filter(i => i.store_id == params.store_id);
      }
      if (params.status) {
        filteredInvoices = filteredInvoices.filter(i => i.status === params.status);
      }
      if (params.date_from) {
        filteredInvoices = filteredInvoices.filter(i => i.created_at >= params.date_from);
      }
      if (params.date_to) {
        filteredInvoices = filteredInvoices.filter(i => i.created_at <= params.date_to);
      }

      return {
        data: {
          success: true,
          invoices: filteredInvoices,
        }
      };
    }

    if (endpoint.startsWith('/invoice/') && !endpoint.includes('/payments') && !endpoint.includes('/pdf') && !endpoint.includes('/send-email')) {
      const id = parseInt(endpoint.split('/')[2]);
      const invoice = mockInvoicesList.find(i => i.id === id);
      
      if (!invoice) {
        throw {
          response: {
            data: { message: 'Invoice not found' }
          }
        };
      }

      return {
        data: {
          success: true,
          invoice: invoice,
        }
      };
    }

    if (endpoint.includes('/payments')) {
      const invoiceId = parseInt(endpoint.split('/')[2]);
      const payments = mockPayments.filter(p => p.invoice_id === invoiceId);

      return {
        data: {
          success: true,
          payments: payments,
        }
      };
    }

    if (endpoint === '/invoice/stats') {
      const totalInvoices = mockInvoicesList.length;
      const paidInvoices = mockInvoicesList.filter(i => i.status === 'paid').length;
      const partialInvoices = mockInvoicesList.filter(i => i.status === 'partial').length;
      const unpaidInvoices = mockInvoicesList.filter(i => i.status === 'unpaid').length;
      const totalRevenue = mockInvoicesList.reduce((sum, i) => sum + i.paid_amount, 0);
      const totalDue = mockInvoicesList.reduce((sum, i) => sum + i.due_amount, 0);

      return {
        data: {
          success: true,
          stats: {
            totalInvoices,
            paidInvoices,
            partialInvoices,
            unpaidInvoices,
            totalRevenue,
            totalDue,
          }
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },

  post: async (endpoint, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));

    if (endpoint === '/invoice/store') {
      const invoiceNumber = `INV-${String(mockInvoicesList.length + 1).padStart(3, '0')}`;
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0);
      
      const newInvoice = {
        id: mockInvoicesList.length + 1,
        user_id: data.user_id,
        customer_id: data.customer_id,
        store_id: data.store_id,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        paid_amount: data.paid_amount,
        due_amount: totalAmount - data.paid_amount,
        status: data.paid_amount >= totalAmount ? 'paid' : (data.paid_amount > 0 ? 'partial' : 'unpaid'),
        created_by: data.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: data.items.map((item, index) => ({
          id: index + 1,
          invoice_id: mockInvoicesList.length + 1,
          ...item,
        })),
      };

      mockInvoicesList.push(newInvoice);

      // Add payment if paid amount > 0
      if (data.paid_amount > 0) {
        mockPayments.push({
          id: mockPayments.length + 1,
          invoice_id: newInvoice.id,
          amount: data.paid_amount,
          payment_method: 'cash',
          payment_date: new Date().toISOString(),
          notes: 'Initial payment',
          created_at: new Date().toISOString(),
        });
      }

      return {
        data: {
          success: true,
          message: 'Invoice created successfully',
          invoice: newInvoice,
        }
      };
    }

    if (endpoint.includes('/payment')) {
      const invoiceId = parseInt(endpoint.split('/')[2]);
      const invoiceIndex = mockInvoicesList.findIndex(i => i.id === invoiceId);

      if (invoiceIndex === -1) {
        throw {
          response: {
            data: { message: 'Invoice not found' }
          }
        };
      }

      const newPayment = {
        id: mockPayments.length + 1,
        invoice_id: invoiceId,
        amount: data.amount,
        payment_method: data.payment_method,
        payment_date: data.payment_date || new Date().toISOString(),
        notes: data.notes,
        created_at: new Date().toISOString(),
      };

      mockPayments.push(newPayment);

      // Update invoice
      mockInvoicesList[invoiceIndex].paid_amount += data.amount;
      mockInvoicesList[invoiceIndex].due_amount = Math.max(0, mockInvoicesList[invoiceIndex].total_amount - mockInvoicesList[invoiceIndex].paid_amount);
      mockInvoicesList[invoiceIndex].status = mockInvoicesList[invoiceIndex].due_amount === 0 ? 'paid' : 'partial';
      mockInvoicesList[invoiceIndex].updated_at = new Date().toISOString();

      return {
        data: {
          success: true,
          message: 'Payment added successfully',
          payment: newPayment,
          invoice: mockInvoicesList[invoiceIndex],
        }
      };
    }

    if (endpoint.includes('/send-email')) {
      const id = parseInt(endpoint.split('/')[2]);
      const invoice = mockInvoicesList.find(i => i.id === id);

      if (!invoice) {
        throw {
          response: {
            data: { message: 'Invoice not found' }
          }
        };
      }

      return {
        data: {
          success: true,
          message: 'Invoice sent successfully via email',
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },

  put: async (endpoint, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));

    if (endpoint.startsWith('/invoice/')) {
      const id = parseInt(endpoint.split('/')[2]);
      const invoiceIndex = mockInvoicesList.findIndex(i => i.id === id);

      if (invoiceIndex === -1) {
        throw {
          response: {
            data: { message: 'Invoice not found' }
          }
        };
      }

      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0);
      
      mockInvoicesList[invoiceIndex] = { 
        ...mockInvoicesList[invoiceIndex], 
        customer_id: data.customer_id,
        store_id: data.store_id,
        total_amount: totalAmount,
        items: data.items.map((item, index) => ({
          id: index + 1,
          invoice_id: id,
          ...item,
        })),
        updated_at: new Date().toISOString() 
      };

      return {
        data: {
          success: true,
          message: 'Invoice updated successfully',
          invoice: mockInvoicesList[invoiceIndex],
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },

  delete: async (endpoint) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (endpoint.startsWith('/invoice/')) {
      const id = parseInt(endpoint.split('/')[2]);
      const invoiceIndex = mockInvoicesList.findIndex(i => i.id === id);

      if (invoiceIndex === -1) {
        throw {
          response: {
            data: { message: 'Invoice not found' }
          }
        };
      }

      mockInvoicesList.splice(invoiceIndex, 1);

      // Remove related payments
      const paymentIndex = mockPayments.findIndex(p => p.invoice_id === id);
      if (paymentIndex !== -1) {
        mockPayments.splice(paymentIndex, 1);
      }

      return {
        data: {
          success: true,
          message: 'Invoice deleted successfully',
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },
};

export { mockInvoices };
