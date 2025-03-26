import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Card, { CardHeader, CardBody, CardFooter } from '../../../components/common/Card/Card';
import Input from '../../../components/common/Form/Input';
import Select from '../../../components/common/Form/Select';
import Button from '../../../components/common/Button/Button';
import { useForm } from '../../../hooks/useForm';
import { formatDate } from '../../../lib/utils';

/**
 * Report Form component for generating reports
 * @param {Object} props - Component props
 * @returns {JSX.Element} Report form component
 */
const ReportForm = ({ onGenerate, reportTypes, loading }) => {
  const [selectedReportType, setSelectedReportType] = useState('');
  
  // Initialize form
  const { values, handleChange, handleSubmit, resetForm } = useForm(
    {
      startDate: formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'YYYY-MM-DD'),
      endDate: formatDate(new Date(), 'YYYY-MM-DD'),
      vehicleId: '',
      driverId: ''
    },
    () => ({}) // No validation needed
  );
  
  // Handle report type change
  const handleReportTypeChange = (e) => {
    setSelectedReportType(e.target.value);
    resetForm();
  };
  
  // Handle form submission
  const submitForm = (formValues) => {
    onGenerate(selectedReportType, formValues);
  };

  return (
    <Card className="mb-4">
      <CardHeader title="Generate Report" />
      <CardBody>
        <form onSubmit={(e) => handleSubmit(e, submitForm)}>
          <div className="form-group mb-4">
            <Select
              name="reportType"
              label="Report Type"
              value={selectedReportType}
              options={reportTypes}
              onChange={handleReportTypeChange}
              required
              placeholder="Select report type"
            />
          </div>
          
          {selectedReportType && (
            <div className="report-parameters">
              {['vehicleReport', 'driverReport', 'vehicleLogs'].includes(selectedReportType) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    name="startDate"
                    label="Start Date"
                    type="date"
                    value={values.startDate}
                    onChange={handleChange}
                  />
                  <Input
                    name="endDate"
                    label="End Date"
                    type="date"
                    value={values.endDate}
                    onChange={handleChange}
                  />
                </div>
              )}
              
              {selectedReportType === 'vehicleLogs' && (
                <div className="form-group mb-4">
                  <Select
                    name="vehicleId"
                    label="Vehicle"
                    value={values.vehicleId}
                    onChange={handleChange}
                    required
                    placeholder="Select vehicle"
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!selectedReportType || loading}
              loading={loading}
            >
              Generate Report
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

ReportForm.propTypes = {
  onGenerate: PropTypes.func.isRequired,
  reportTypes: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  loading: PropTypes.bool
};

export default ReportForm;