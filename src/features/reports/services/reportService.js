import supabase from '../../../lib/supabase';
import { downloadCSV, formatDate, formatNumber } from '../../../lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Service for report-related operations
 */
const reportService = {
  /**
   * Generate a vehicle report with optional date range filtering
   * @param {Date} startDate - Optional start date for filtering
   * @param {Date} endDate - Optional end date for filtering
   * @returns {Promise<Object>} Result object with data or error
   */
  async generateVehicleReport(startDate = null, endDate = null) {
    try {
      const formattedStartDate = startDate ? formatDate(startDate, 'YYYY-MM-DD') : null;
      const formattedEndDate = endDate ? formatDate(endDate, 'YYYY-MM-DD') : null;
      
      const { data, error } = await supabase.rpc('generate_vehicle_report', {
        start_date_val: formattedStartDate,
        end_date_val: formattedEndDate
      });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error generating vehicle report:', error);
      return { error };
    }
  },
  
  /**
   * Generate a driver report with optional date range filtering
   * @param {Date} startDate - Optional start date for filtering
   * @param {Date} endDate - Optional end date for filtering
   * @returns {Promise<Object>} Result object with data or error
   */
  async generateDriverReport(startDate = null, endDate = null) {
    try {
      const formattedStartDate = startDate ? formatDate(startDate, 'YYYY-MM-DD') : null;
      const formattedEndDate = endDate ? formatDate(endDate, 'YYYY-MM-DD') : null;
      
      const { data, error } = await supabase.rpc('generate_driver_report', {
        start_date_val: formattedStartDate,
        end_date_val: formattedEndDate
      });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error generating driver report:', error);
      return { error };
    }
  },
  
  /**
   * Generate a document status report
   * @returns {Promise<Object>} Result object with data or error
   */
  async generateDocumentStatusReport() {
    try {
      const { data, error } = await supabase.rpc('get_expiring_documents');
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error generating document status report:', error);
      return { error };
    }
  },
  
  /**
   * Generate a service due report
   * @returns {Promise<Object>} Result object with data or error
   */
  async generateServiceDueReport() {
    try {
      const { data, error } = await supabase.rpc('get_vehicles_due_for_service');
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error generating service due report:', error);
      return { error };
    }
  },
  
  /**
   * Generate a vehicle logs report
   * @param {string} vehicleId - ID of the vehicle
   * @param {Date} startDate - Optional start date for filtering
   * @param {Date} endDate - Optional end date for filtering
   * @returns {Promise<Object>} Result object with data or error
   */
  async generateVehicleLogsReport(vehicleId, startDate = null, endDate = null) {
    try {
      const formattedStartDate = startDate ? formatDate(startDate, 'YYYY-MM-DD') : null;
      const formattedEndDate = endDate ? formatDate(endDate, 'YYYY-MM-DD') : null;
      
      const { data, error } = await supabase.rpc('get_vehicle_logs', {
        v_id: vehicleId,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error generating vehicle logs report:', error);
      return { error };
    }
  },
  
  /**
   * Download report as CSV
   * @param {Array} data - Report data
   * @param {string} reportType - Type of report
   */
  downloadReportCSV(data, reportType) {
    if (!data || !data.length) return;
    
    const filename = `${reportType}_report_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
    downloadCSV(data, filename);
  },
  
  /**
   * Generate PDF report
   * @param {Array} data - Report data
   * @param {Array} columns - Column definitions
   * @param {string} title - Report title
   * @param {string} reportType - Type of report
   */
  generatePDF(data, columns, title, reportType) {
    try {
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(18);
      pdf.text(title, 14, 22);
      
      // Add date
      pdf.setFontSize(11);
      pdf.text(`Generated on: ${formatDate(new Date())}`, 14, 30);
      
      // Prepare table data
      const tableColumn = columns.map(col => col.title);
      const tableRows = data.map(item => {
        return columns.map(column => {
          let value = item[column.field];
          
          // Format values based on type
          if (column.isDate && value) {
            return formatDate(value);
          } else if (column.isNumber && value !== undefined && value !== null) {
            return formatNumber(value);
          } else if (value === null || value === undefined) {
            return '-';
          }
          
          return String(value);
        });
      });
      
      // AutoTable plugin creates the table
      pdf.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 35 } }
      });
      
      // Save PDF
      pdf.save(`${reportType}_report_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  }
};

export default reportService;