import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../../components/common/Form/Input';
import Select from '../../components/common/Form/Select';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import { VEHICLE_STATUS } from '../../lib/constants';
import supabase from '../../lib/supabase';

/**
 * Vehicle form component for adding and editing vehicle information
 */
const VehicleForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save'
}) => {
  // Set default values with fallbacks
  const defaultValues = {
    plate_number: '',
    model: '',
    year: new Date().getFullYear(),
    status: VEHICLE_STATUS.AVAILABLE,
    driver_id: '',
    ...initialValues
  };
  
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Driver selection state
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driverError, setDriverError] = useState('');

  // Update values when initialValues change
  useEffect(() => {
    setValues({
      plate_number: '',
      model: '',
      year: new Date().getFullYear(),
      status: VEHICLE_STATUS.AVAILABLE,
      driver_id: '',
      ...initialValues
    });
  }, [initialValues]);

  // Fetch available drivers when status is "assigned"
  useEffect(() => {
    if (values.status === VEHICLE_STATUS.ASSIGNED) {
      fetchDrivers();
    }
  }, [values.status]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special case for status field - clear driver_id if not assigned
    if (name === 'status' && value !== VEHICLE_STATUS.ASSIGNED) {
      setValues(prevValues => ({
        ...prevValues,
        [name]: value,
        driver_id: ''
      }));
    } else {
      setValues(prevValues => ({
        ...prevValues,
        [name]: value
      }));
    }

    // Clear error for the field
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  // Handle input blur for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
    
    validateField(name, values[name]);
  };

  // Fetch drivers from database
  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      setDriverError('');
      
      // Get authenticated session
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        throw new Error('Authentication required');
      }
      
      // Fetch all drivers
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('role', 'driver')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setDrivers(data || []);
      if ((data || []).length === 0) {
        setDriverError('No drivers found. Please add drivers first.');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDriverError('Failed to load drivers: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Validate a single field
  const validateField = (name, value) => {
    let fieldError = '';

    switch (name) {
      case 'plate_number':
        if (!value.trim()) {
          fieldError = 'Plate number is required';
        } else if (value.length < 2 || value.length > 20) {
          fieldError = 'Plate number must be between 2 and 20 characters';
        }
        break;
      
      case 'model':
        if (!value.trim()) {
          fieldError = 'Model is required';
        } else if (value.length < 2 || value.length > 100) {
          fieldError = 'Model must be between 2 and 100 characters';
        }
        break;

      case 'year':
        const yearValue = parseInt(value);
        const currentYear = new Date().getFullYear();
        
        if (!yearValue) {
          fieldError = 'Year is required';
        } else if (yearValue < 1900 || yearValue > currentYear + 1) {
          fieldError = `Year must be between 1900 and ${currentYear + 1}`;
        }
        break;
      
      case 'driver_id':
        // Only validate driver_id if status is "assigned"
        if (values.status === VEHICLE_STATUS.ASSIGNED && !value) {
          fieldError = 'Driver is required when status is Assigned';
        }
        break;
        
      default:
        break;
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: fieldError
    }));

    return !fieldError;
  };

  // Validate all fields
  const validateForm = () => {
    const formErrors = {};
    let isValid = true;

    // Validate each field
    Object.keys(values).forEach(key => {
      if (!validateField(key, values[key])) {
        isValid = false;
        formErrors[key] = errors[key] || `${key} is invalid`;
      }
    });

    setErrors(formErrors);
    
    // Set all fields as touched
    const touchedFields = {};
    Object.keys(values).forEach(key => {
      touchedFields[key] = true;
    });
    setTouched(touchedFields);

    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Format year as integer
      const formattedValues = {
        ...values,
        year: parseInt(values.year)
      };
      
      onSubmit(formattedValues);
    }
  };

  // Status options for dropdown
  const statusOptions = Object.values(VEHICLE_STATUS).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }));

  // Generate a range of years for the year dropdown
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="vehicle-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Plate Number"
          name="plate_number"
          value={values.plate_number}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.plate_number && errors.plate_number}
          required
        />

        <Input
          label="Model"
          name="model"
          value={values.model}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.model && errors.model}
          required
        />

        <Select
          label="Year"
          name="year"
          value={values.year ? values.year.toString() : ''}
          options={yearOptions.map(year => ({ value: year.toString(), label: year.toString() }))}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.year && errors.year}
          required
        />

        <Select
          label="Status"
          name="status"
          value={values.status}
          options={statusOptions}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.status && errors.status}
          required
        />
        
        {/* Driver dropdown (only shown when status is "assigned") */}
        {values.status === VEHICLE_STATUS.ASSIGNED && (
          <div className="md:col-span-2">
            {loadingDrivers ? (
              <div className="py-2">
                <Loader size="small" text="Loading available drivers..." />
              </div>
            ) : drivers.length > 0 ? (
              <Select
                label="Assign Driver"
                name="driver_id"
                value={values.driver_id || ''}
                options={[
                  { value: '', label: 'Select a driver' },
                  ...drivers.map(driver => ({
                    value: driver.id,
                    label: driver.name
                  }))
                ]}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.driver_id && errors.driver_id}
                required
              />
            ) : (
              <div className="text-red-500 text-sm mt-2">
                {driverError || 'No available drivers found. Please add drivers first.'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

VehicleForm.propTypes = {
  initialValues: PropTypes.shape({
    plate_number: PropTypes.string,
    model: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    driver_id: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  submitLabel: PropTypes.string
};

export default VehicleForm;