import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '../../../hooks/useForm';
import { formatDate } from '../../../lib/utils';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Form/Input';
import Select from '../../../components/common/Form/Select';
import VehicleService from '../../vehicles/services/vehicleService';
import DriverService from '../../drivers/services/driverService';

/**
 * Assignment Form component for creating or editing vehicle assignments
 * @param {Object} props - Component props
 * @returns {JSX.Element} Assignment form component
 */
const AssignmentForm = ({ 
  assignment, 
  vehicleId, 
  driverId, 
  onSubmit, 
  onCancel 
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!assignment;

  // Set initial date/time values - defaults to today and 1 hour from now
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const formatDateTimeForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  // Define initial values
  const initialValues = {
    vehicle_id: vehicleId || assignment?.vehicle_id || '',
    driver_id: driverId || assignment?.driver_id || '',
    start_date: assignment?.start_date 
      ? formatDateTimeForInput(new Date(assignment.start_date)) 
      : formatDateTimeForInput(now),
    end_date: assignment?.end_date 
      ? formatDateTimeForInput(new Date(assignment.end_date)) 
      : formatDateTimeForInput(tomorrow),
    reason: assignment?.reason || ''
  };

  // Define validation function
  const validate = (values) => {
    const errors = {};

    if (!values.vehicle_id) {
      errors.vehicle_id = 'Please select a vehicle';
    }

    if (!values.driver_id) {
      errors.driver_id = 'Please select a driver';
    }

    if (!values.start_date) {
      errors.start_date = 'Start date and time is required';
    }

    if (!values.end_date) {
      errors.end_date = 'End date and time is required';
    } else if (new Date(values.end_date) <= new Date(values.start_date)) {
      errors.end_date = 'End date must be after start date';
    }

    if (!values.reason.trim()) {
      errors.reason = 'Please provide a reason for this assignment';
    }

    return errors;
  };

  // Initialize form hook
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue
  } = useForm(initialValues, validate, onSubmit);

  // Fetch vehicles and drivers for selection
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Only fetch vehicles if not provided through props
        if (!vehicleId) {
          const vehicleData = await VehicleService.getVehicles();
          // Filter to only available vehicles
          const availableVehicles = vehicleData.filter(v => 
            v.status === 'available' || (isEditMode && v.id === assignment.vehicle_id)
          );
          setVehicles(availableVehicles);
        } else if (vehicleId && vehicles.length === 0) {
          // If vehicleId is provided but we don't have the vehicle details
          const vehicle = await VehicleService.getVehicleById(vehicleId);
          setVehicles([vehicle]);
        }
        
        // Only fetch drivers if not provided through props
        if (!driverId) {
          const driverData = await DriverService.getDrivers();
          setDrivers(driverData);
        } else if (driverId && drivers.length === 0) {
          // If driverId is provided but we don't have the driver details
          const driver = await DriverService.getDriverById(driverId);
          setDrivers([driver]);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicleId, driverId, isEditMode, assignment]);

  // Format options for dropdowns
  const vehicleOptions = vehicles.map(vehicle => ({
    value: vehicle.id,
    label: `${vehicle.plate_number} - ${vehicle.model}`
  }));

  const driverOptions = drivers.map(driver => ({
    value: driver.id,
    label: driver.name
  }));

  return (
    <form onSubmit={handleSubmit} className="assignment-form">
      <div className="form-grid">
        <Select
          name="vehicle_id"
          label="Vehicle"
          value={values.vehicle_id}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.vehicle_id && errors.vehicle_id}
          options={vehicleOptions}
          required
          disabled={loading || vehicles.length === 0 || !!vehicleId}
          helperText={loading ? 'Loading vehicles...' : vehicles.length === 0 ? 'No available vehicles' : ''}
        />
        
        <Select
          name="driver_id"
          label="Driver"
          value={values.driver_id}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.driver_id && errors.driver_id}
          options={driverOptions}
          required
          disabled={loading || drivers.length === 0 || !!driverId}
          helperText={loading ? 'Loading drivers...' : drivers.length === 0 ? 'No drivers available' : ''}
        />
        
        <div className="date-time-group">
          <Input
            name="start_date"
            type="datetime-local"
            label="Start Date & Time"
            value={values.start_date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.start_date && errors.start_date}
            required
          />
          
          <Input
            name="end_date"
            type="datetime-local"
            label="End Date & Time"
            value={values.end_date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.end_date && errors.end_date}
            min={values.start_date}
            required
          />
        </div>
        
        <Input
          name="reason"
          label="Reason for Assignment"
          value={values.reason}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.reason && errors.reason}
          placeholder="Enter reason for this temporary assignment"
          required
          multiline
          rows={4}
        />
      </div>
      
      <div className="assignment-summary">
        {values.vehicle_id && values.driver_id && values.start_date && values.end_date && (
          <div className="summary-box">
            <h4 className="summary-title">Assignment Summary</h4>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">Vehicle:</span>
                <span className="summary-value">
                  {vehicles.find(v => v.id === values.vehicle_id)?.plate_number || 'Selected vehicle'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Driver:</span>
                <span className="summary-value">
                  {drivers.find(d => d.id === values.driver_id)?.name || 'Selected driver'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Duration:</span>
                <span className="summary-value">
                  {values.start_date && values.end_date ? 
                    `${formatDate(values.start_date)} to ${formatDate(values.end_date)}` : 
                    'Selected time period'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {isEditMode ? 'Update Assignment' : 'Create Assignment'}
        </Button>
      </div>
      
      <style jsx>{`
        .assignment-form {
          padding: var(--spacing-sm);
        }
        
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .date-time-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }
        
        .assignment-summary {
          margin-bottom: var(--spacing-lg);
        }
        
        .summary-box {
          background-color: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
        }
        
        .summary-title {
          margin-top: 0;
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-md);
          color: var(--primary-color);
        }
        
        .summary-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .summary-item {
          display: flex;
          align-items: center;
        }
        
        .summary-label {
          font-weight: 500;
          width: 80px;
          color: var(--text-secondary);
        }
        
        .summary-value {
          font-weight: 500;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
        }
        
        @media (max-width: 768px) {
          .date-time-group {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
};

AssignmentForm.propTypes = {
  assignment: PropTypes.object,
  vehicleId: PropTypes.string,
  driverId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default AssignmentForm;