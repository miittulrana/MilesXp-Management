import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '../../../hooks/useForm';
import { VEHICLE_STATUS } from '../../../lib/constants';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Form/Input';
import Select from '../../../components/common/Form/Select';
import DriverService from '../../drivers/services/driverService';

/**
 * Vehicle Form component for adding and editing vehicles
 * @param {Object} props - Component props
 * @returns {JSX.Element} Vehicle form component
 */
const VehicleForm = ({ vehicle, onSubmit, onCancel }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!vehicle;

  // Define initial values
  const initialValues = {
    plate_number: vehicle?.plate_number || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    status: vehicle?.status || VEHICLE_STATUS.AVAILABLE,
    assigned_to: vehicle?.assigned_to || ''
  };

  // Define validation function
  const validate = (values) => {
    const errors = {};

    if (!values.plate_number.trim()) {
      errors.plate_number = 'Plate number is required';
    }

    if (!values.model.trim()) {
      errors.model = 'Model is required';
    }

    if (!values.year) {
      errors.year = 'Year is required';
    } else if (isNaN(values.year) || values.year < 1900 || values.year > new Date().getFullYear() + 1) {
      errors.year = 'Please enter a valid year';
    }

    if (values.status === VEHICLE_STATUS.ASSIGNED && !values.assigned_to) {
      errors.assigned_to = 'Please select a driver for assignment';
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

  // Load drivers for assignment
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const driverData = await DriverService.getDrivers();
        setDrivers(driverData);
      } catch (error) {
        console.error('Error loading drivers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  // When status changes to assigned, ensure a driver is selected
  useEffect(() => {
    if (values.status === VEHICLE_STATUS.ASSIGNED && !values.assigned_to && drivers.length > 0) {
      setFieldValue('assigned_to', drivers[0].id);
    }
  }, [values.status, values.assigned_to, drivers, setFieldValue]);

  // Format drivers for select
  const driverOptions = drivers.map(driver => ({
    value: driver.id,
    label: driver.name
  }));

  // Status options
  const statusOptions = Object.values(VEHICLE_STATUS).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }));

  return (
    <form onSubmit={handleSubmit} className="vehicle-form">
      <div className="form-grid">
        <Input
          name="plate_number"
          label="Plate Number"
          value={values.plate_number}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.plate_number && errors.plate_number}
          placeholder="Enter plate number"
          required
        />
        
        <Input
          name="model"
          label="Model"
          value={values.model}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.model && errors.model}
          placeholder="Enter vehicle model"
          required
        />
        
        <Input
          name="year"
          type="number"
          label="Year"
          value={values.year}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.year && errors.year}
          min="1900"
          max={new Date().getFullYear() + 1}
          required
        />
        
        <Select
          name="status"
          label="Status"
          value={values.status}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.status && errors.status}
          options={statusOptions}
          required
        />
        
        {values.status === VEHICLE_STATUS.ASSIGNED && (
          <Select
            name="assigned_to"
            label="Assign to Driver"
            value={values.assigned_to}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.assigned_to && errors.assigned_to}
            options={driverOptions}
            required
            disabled={loading || drivers.length === 0}
            helperText={loading ? 'Loading drivers...' : drivers.length === 0 ? 'No drivers available' : ''}
          />
        )}
      </div>
      
      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {isEditMode ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </div>
      
      <style jsx>{`
        .vehicle-form {
          padding: var(--spacing-sm);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
};

VehicleForm.propTypes = {
  vehicle: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default VehicleForm;