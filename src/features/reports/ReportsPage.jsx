// src/features/reports/ReportsPage.jsx
import React, { useState } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader, CardFooter } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Select from '../../components/common/Form/Select';
import Input from '../../components/common/Form/Input';
import reportService from './reportService';
import { useToast } from '../../hooks/useToast';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    vehicleId: '',
    driverId: ''
  });
  
  const { showSuccess, showError } = useToast();
  
  const reportTypes = [
    { value: 'vehicleReport', label: 'Vehicle Report' },
    { value: 'driverReport', label: 'Driver Report' },
    { value: 'documentStatus', label: 'Document Status Report' },
    { value: 'serviceDue', label: 'Service Due Report' },
    { value: 'vehicleLogs', label: 'Vehicle Logs Report' }
  ];
  
  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setReportData([]);
  };
  
  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGenerateReport = async () => {
    if (!reportType) {
      showError('Please select a report type');
      return;
    }
    
    setLoading(true);
    
    try {
      let result;
      
      switch (reportType) {
        case 'vehicleReport':
          result = await reportService.generateVehicleReport(params.startDate, params.endDate);
          break;
        case 'driverReport':
          result = await reportService.generateDriverReport(params.startDate, params.endDate);
          break;
        case 'documentStatus':
          result = await reportService.generateDocumentStatusReport();
          break;
        case 'serviceDue':
          result = await reportService.generateServiceDueReport();
          break;
        case 'vehicleLogs':
          result = await reportService.generateVehicleLogsReport(
            params.vehicleId,
            params.startDate,
            params.endDate
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
        showError('No data available for the selected parameters');
        setReportData([]);
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
  
  const handleDownloadCSV = () => {
    if (!reportData.length) return;
    
    reportService.downloadReportCSV(reportData, reportType);
    showSuccess('CSV download started');
  };
  
  // Render report table columns based on report type
  const renderReportColumns = () => {
    switch (reportType) {
      case 'vehicleReport':
        return (
          <tr>
            <th>Plate Number</th>
            <th>Model</th>
            <th>Year</th>
            <th>Status</th>
            <th>Driver</th>
            <th>Documents</th>
            <th>Service Status</th>
          </tr>
        );
      case 'driverReport':
        return (
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Documents</th>
            <th>Vehicle</th>
            <th>Assignments</th>
          </tr>
        );
      case 'documentStatus':
        return (
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Entity</th>
            <th>Expiry Date</th>
            <th>Days Remaining</th>
            <th>Status</th>
          </tr>
        );
      case 'serviceDue':
        return (
          <tr>
            <th>Vehicle</th>
            <th>Current KM</th>
            <th>Next Service KM</th>
            <th>KM Remaining</th>
            <th>Status</th>
          </tr>
        );
      case 'vehicleLogs':
        return (
          <tr>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Duration</th>
            <th>Reason</th>
          </tr>
        );
      default:
        return <tr><th>Select a report type</th></tr>;
    }
  };
  
  // Simplified rendering of report data
  const renderReportData = () => {
    if (!reportData.length) return null;
    
    return reportData.map((item, index) => (
      <tr key={index}>
        {Object.values(item).map((value, valueIndex) => (
          <td key={valueIndex}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </td>
        ))}
      </tr>
    ));
  };
  
  return (
    <div className="reports-page">
      <h1>Reports</h1>
      
      <Card className="mb-4">
        <CardHeader title="Generate Report" />
        <CardBody>
          <div className="form-container">
            <Select
              name="reportType"
              label="Report Type"
              value={reportType}
              options={reportTypes}
              onChange={handleReportTypeChange}
              placeholder="Select report type"
            />
            
            {reportType && (
              <div className="report-params">
                {['vehicleReport', 'driverReport', 'vehicleLogs'].includes(reportType) && (
                  <div className="date-range">
                    <Input
                      name="startDate"
                      label="Start Date"
                      type="date"
                      value={params.startDate}
                      onChange={handleParamChange}
                    />
                    <Input
                      name="endDate"
                      label="End Date"
                      type="date"
                      value={params.endDate}
                      onChange={handleParamChange}
                    />
                  </div>
                )}
                
                {reportType === 'vehicleLogs' && (
                  <Select
                    name="vehicleId"
                    label="Vehicle"
                    value={params.vehicleId}
                    onChange={handleParamChange}
                    options={[
                      { value: '1', label: 'Vehicle 1' },
                      { value: '2', label: 'Vehicle 2' }
                    ]}
                    placeholder="Select vehicle"
                  />
                )}
              </div>
            )}
            
            <div className="form-actions">
              <Button 
                onClick={handleGenerateReport} 
                disabled={!reportType || loading}
                loading={loading}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {reportData.length > 0 && (
        <Card>
          <CardHeader title="Report Results" />
          <CardBody>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  {renderReportColumns()}
                </thead>
                <tbody>
                  {renderReportData()}
                </tbody>
              </table>
            </div>
          </CardBody>
          <CardFooter>
            <div className="download-actions">
              <Button variant="outline" onClick={handleDownloadCSV}>
                Download CSV
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      
      <style jsx>{`
        .reports-page {
          padding: 20px;
        }
        
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .report-params {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 10px;
        }
        
        .date-range {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .report-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .report-table th, .report-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .download-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        @media (max-width: 768px) {
          .date-range {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;