// Mock Reports API
import { generateMockReports, generateMockSummary } from '../mockData/reportsData';

export const mockReports = {
  // Get all reports with optional date filtering
  get: async (endpoint, { params = {} }) => {
    console.log('Mock Reports API - GET:', endpoint, params);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (endpoint === '/reports/') {
      const reports = generateMockReports(params.start_date, params.end_date);
      return {
        data: {
          data: reports,
          summary: generateMockSummary(reports),
          pagination: {
            current_page: 1,
            total: reports.length,
            per_page: 20,
            last_page: 1
          }
        },
        status: 200
      };
    }
    
    if (endpoint === '/reports/summary') {
      const reports = generateMockReports(params.start_date, params.end_date);
      return {
        data: generateMockSummary(reports),
        status: 200
      };
    }
    
    if (endpoint.startsWith('/reports/') && endpoint.endsWith('/export')) {
      return {
        data: {
          download_url: 'https://example.com/reports/export.pdf',
          file_name: `reports_${params.format || 'pdf'}.pdf`
        },
        status: 200
      };
    }
    
    if (endpoint === '/reports/sales') {
      const reports = generateMockReports(params.start_date, params.end_date)
        .filter(r => r.type === 'sales');
      return {
        data: reports,
        status: 200
      };
    }
    
    if (endpoint === '/reports/purchases') {
      const reports = generateMockReports(params.start_date, params.end_date)
        .filter(r => r.type === 'purchases');
      return {
        data: reports,
        status: 200
      };
    }
    
    if (endpoint === '/reports/inventory') {
      const reports = generateMockReports(params.start_date, params.end_date)
        .filter(r => r.type === 'inventory');
      return {
        data: reports,
        status: 200
      };
    }
    
    if (endpoint === '/reports/profits') {
      const reports = generateMockReports(params.start_date, params.end_date)
        .filter(r => r.type === 'profits');
      return {
        data: reports,
        status: 200
      };
    }
    
    // Get single report by ID
    const reportIdMatch = endpoint.match(/\/reports\/(\d+)/);
    if (reportIdMatch) {
      const reportId = parseInt(reportIdMatch[1]);
      const allReports = generateMockReports();
      const report = allReports.find(r => r.id === reportId);
      
      if (report) {
        return {
          data: report,
          status: 200
        };
      } else {
        return {
          data: { error: 'Report not found' },
          status: 404
        };
      }
    }
    
    return {
      data: [],
      status: 200
    };
  },
  
  post: async (endpoint, data) => {
    console.log('Mock Reports API - POST:', endpoint, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: { success: true, message: 'Report created successfully' },
      status: 201
    };
  },
  
  put: async (endpoint, data) => {
    console.log('Mock Reports API - PUT:', endpoint, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: { success: true, message: 'Report updated successfully' },
      status: 200
    };
  },
  
  delete: async (endpoint) => {
    console.log('Mock Reports API - DELETE:', endpoint);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: { success: true, message: 'Report deleted successfully' },
      status: 200
    };
  }
};
