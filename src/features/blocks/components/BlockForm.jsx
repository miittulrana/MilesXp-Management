import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '../../../hooks/useForm';
import { formatDate } from '../../../lib/utils';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Form/Input';
import Select from '../../../components/common/Form/Select';
import VehicleService from '../../vehicles/services/vehicleService';

/**
 * BlockForm component for creating or editing vehicle blocks
 * @param {Object} props - Component props
 * @returns {JSX.Element} Block form component
 */
const BlockForm = ({ 
  block, 
  vehicleId, 
  onSubmit, 
  onCancel 
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!block;

  // Set initial date/time values - defaults to today and 1 hour from now
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 7); // Default to 7 days block period
  
  const formatDateTimeForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  // Define initial values
  const initialValues = {
    vehicle_id: vehicleId || block?.vehicle_id || '',
    start_date: block?.start_date 
      ? formatDateTimeForInput(new Date(block.start_date)) 
      : formatDateTimeForInput(now),
    end_date: block?.end_date 
      ? formatDateTimeForInput(new Date(block.end_date)) 
      : formatDateTimeForInput(tomorrow),
    reason: block?.reason || ''
  };

  // Define validation function
  const validate = (values) => {
    const errors = {};

    if (!values.vehicle_id) {
      errors.vehicle_id = 'Please select a vehicle';
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
      errors.reason = 'Please provide a reason for blocking this vehicle';
    } else if (values.reason.length < 10) {
      errors.reason = 'Please provide a more detailed reason';
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
    handleSubmit
  } = useForm(initialValues, validate, onSubmit);

  // Fetch vehicles for selection
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        
        // Only fetch vehicles if not provided through props
        if (!vehicleId) {
          const vehicleData = await VehicleService.getVehicles();
          // Filter to only available vehicles or the currently blocked vehicle
          const availableVehicles = vehicleData.filter(v => 
            v.status === 'available' || 
            v.status === 'assigned' || 
            (isEditMode && v.id === block.vehicle_id)
          );
          setVehicles(availableVehicles);
        } else if (vehicleId && vehicles.length === 0) {
          // If vehicleId is provided but we don't have the vehicle details
          const vehicle = await VehicleService.getVehicleById(vehicleId);
          setVehicles([vehicle]);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [vehicleId, isEditMode, block]);

  // Format vehicle options for dropdown
  const vehicleOptions = vehicles.map(vehicle => ({
    value: vehicle.id,
    label: `${vehicle.plate_number} - ${vehicle.model} ${vehicle.status === 'assigned' ? '(Assigned)' : ''}`
  }));

  // Get selected vehicle info
  const selectedVehicle = vehicles.find(v => v.id === values.vehicle_id);

  return (
    <form onSubmit={handleSubmit} className="block-form">
      <div className="form-grid">
        <Select
          name="vehicle_id"
          label="Vehicle to Block"
          value={values.vehicle_id}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.vehicle_id && errors.vehicle_id}
          options={vehicleOptions}
          required
          disabled={loading || vehicles.length === 0 || !!vehicleId || isEditMode}
          helperText={loading ? 'Loading vehicles...' : vehicles.length === 0 ? 'No available vehicles' : ''}
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
          label="Reason for Blocking"
          value={values.reason}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.reason && errors.reason}
          placeholder="Enter detailed reason for blocking this vehicle"
          required
          multiline
          rows={4}
        />
      </div>
      
      {selectedVehicle && selectedVehicle.status === 'assigned' && (
        <div className="warning-message">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <strong>Warning:</strong> This vehicle is currently assigned to a driver. 
            Blocking it will make it unavailable for that driver and may affect operations.
          </div>
        </div>
      )}
      
      <div className="block-summary">
        {values.vehicle_id && values.start_date && values.end_date && (
          <div className="summary-box">
            <h4 className="summary-title">Block Summary</h4>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">Vehicle:</span>
                <span className="summary-value">
                  {vehicles.find(v => v.id === values.vehicle_id)?.plate_number || 'Selected vehicle'}
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
          {isEditMode ? 'Update Block' : 'Block Vehicle'}
        </Button>
      </div>
      
      <style jsx>{`
        .block-form {
          padding: var(--spacing-sm);
        }
        
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }
        
        .date-time-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }
        
        .warning-message {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
          background-color: rgba(255, 193, 7, 0.1);
          color: var(--warning-color);
          padding: var(--spacing-md);
          border-radius: var(--border-radius-md);
          margin-bottom: var(--spacing-md);
        }
        
        .warning-message svg {
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .block-summary {
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

BlockForm.propTypes = {
  block: PropTypes.object,
  vehicleId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default BlockForm;