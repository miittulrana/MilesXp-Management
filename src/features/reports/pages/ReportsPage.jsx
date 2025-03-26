import React, { useState } from 'react';
import ReportForm from '../components/ReportForm';
import ReportView from '../components/ReportView';
import reportService from '../services/reportService';
import { useToast } from '../../../hooks/useToast';
import { formatDate, getStatusBadgeClass } from '../../../lib/utils';

/**
 * Reports Page component
 * @returns {JSX.Element} Reports page component
 */
const ReportsPage = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentReportType, setCurrentReportType] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const { showSuccess, showError } = useToast();
  
  // Report types
  const reportTypes = [
    { value: 'vehicleReport', label: 'Vehicle Report' },
    { value: 'driverReport', label: 'Driver Report' },
    { value: 'documentStatus', label: 'Document Status Report' },
    { value: 'serviceDue', label: 'Service Due Report' },
    { value: 'vehicleLogs', label: 'Vehicle Logs Report' }
  ];
  
  // Column definitions for different report types
  const reportColumns = {
    vehicleReport: [
      { field: 'plate_number', title: 'Plate Number' },
      { field: 'model', title: 'Model' },
      { field: 'year', title: 'Year', isNumber: true },
      { 
        field: 'status', 
        title: 'Status',
        render: (value) => (
          <span className={getStatusBadgeClass(value, 'vehicle')}>
            {value}
          </span>
        )
      },
      { field: 'driver_name', title: 'Driver' },
      { 
        field: 'document_status', 
        title: 'Document Status',
        render: (value) => (
          <span className={getStatusBadgeClass(value, 'document')}>
            {value}
          </span>
        )
      },
      { 
        field: 'service_status', 
        title: 'Service Status',
        render: (value) => (
          <span className={getStatusBadgeClass(value, 'service')}>
            {value}
          </span>
        )
      },
      { field: 'last_service_km', title: 'Last Service KM', isNumber: true },
      { field: 'next_service_km', title: 'Next Service KM', isNumber: true },
      { field: 'total_assignments', title: 'Total Assignments', isNumber: true }
    ],
    driverReport: [
      { field: 'driver_name', title: 'Driver Name' },
      { field: 'email', title: 'Email' },
      { field: 'phone', title: 'Phone' },
      { 
        field: 'document_status', 
        title: 'Document Status',
        render: (value) => (
          <span className={getStatusBadgeClass(value, 'document')}>
            {value}
          </span>
        )
      },
      { field: 'assigned_vehicle', title: 'Assigned Vehicle' },
      { field: 'total_assignments', title: 'Total Assignments', isNumber: true },
      { field: 'total_km_driven', title: 'Total KM Driven', isNumber: true }
    ],
    documentStatus: [
      { field: 'name', title: 'Document Name' },
      { field: 'type', title: 'Document Type' },
      { field: 'entity_name', title: 'Entity Name' },
      { field: 'entity_type', title: 'Entity Type' },
      { 
        field: 'expiry_date', 
        title: 'Expiry Date',
        isDate: true,
        render: (value) => formatDate(value)
      },
      { field: 'days_remaining', title: 'Days Remaining', isNumber: true },
      { field: 'email', title: 'Notification Email' }
    ],
    serviceDue: [
      { field: 'plate_number', title: 'Plate Number' },
      { field: 'current_km', title: 'Current KM', isNumber: true },
      { field: 'next_service_km', title: 'Next Service KM', isNumber: true },
      { field: 'km_remaining', title: 'KM Remaining', isNumber: true },
      { field: 'driver_name', title: 'Driver Name' },
      { field: 'driver_email', title: 'Driver Email' }
    ],
    vehicleLogs: [
      { field: 'vehicle_plate', title: 'Vehicle Plate' },
      { field: 'driver_name', title: 'Driver Name' },
      { 
        field: 'start_time', 
        title: 'Start Time',
        isDate: true,
        render: (value) => formatDate(value, 'YYYY-MM-DD HH:mm')
      },
      { 
        field: 'end_time', 
        title: 'End Time',
        isDate: true,
        render: (value) => formatDate(value, 'YYYY-MM-DD HH:mm')
      },
      { field: 'duration', title: 'Duration' },
      { field: 'reason', title: 'Reason' },
      { field: 'assigned_by', title: 'Assigned By' },
      { 
        field: 'assignment_date', 
        title: 'Assignment Date',
        isDate: true,
        render: (value) => formatDate(value)
      }
    ]
  };
  
  // Generate report based on type and parameters
  const handleGenerateReport = async (reportType, parameters) => {
    setLoading(true);
    setCurrentReportType(reportType);
    setReportData([]);
    
    try {
      let result;
      
      switch (reportType) {
        case 'vehicleReport':
          setReportTitle('Vehicle Report');
          result = await reportService.generateVehicleReport(
            parameters.startDate, 
            parameters.endDate
          );
          break;
          
        case 'driverReport':
          setReportTitle('Driver Report');
          result = await reportService.generateDriverReport(
            parameters.startDate, 
            parameters.endDate
          );
          break;
          
        case 'documentStatus':
          setReportTitle('Document Status Report');
          result = await reportService.generateDocumentStatusReport();
          break;
          
        case 'serviceDue':
          setReportTitle('Service Due Report');
          result = await reportService.generateServiceDueReport();
          break;
          
        case 'vehicleLogs':
          setReportTitle('Vehicle Logs Report');
          result = await reportService.generateVehicleLogsReport(
            parameters.vehicleId,
            parameters.startDate,
            parameters.endDate
          );
          break;
          
        default:
          showError('Invalid report type');
          setLoading(false);
          return;
      }
      
      if (result.error) {
        showError(`Error generating report: ${result.error.message}`);
      } else if (!result.data || result.data.length === 0) {
        showInfo('No data available for the selected parameters');
      } else {
        setReportData(result.data);
        showSuccess('Report generated successfully');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle CSV download
  const handleDownloadCSV = (data, reportType) => {
    reportService.downloadReportCSV(data, reportType);
    showSuccess('CSV download started');
  };
  
  // Handle PDF download
  const handleDownloadPDF = (data, columns, title, reportType) => {
    const success = reportService.generatePDF(data, columns, title, reportType);
    if (success) {
      showSuccess('PDF download started');
    } else {
      showError('Failed to generate PDF');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      <ReportForm
        onGenerate={handleGenerateReport}
        reportTypes={reportTypes}
        loading={loading}
      />
      
      {currentReportType && (
        <ReportView
          data={reportData}
          columns={reportColumns[currentReportType]}
          title={reportTitle}
          reportType={currentReportType}
          loading={loading}
          onDownloadCSV={handleDownloadCSV}
          onDownloadPDF={handleDownloadPDF}
        />
      )}
    </div>
  );
};

export default ReportsPage;