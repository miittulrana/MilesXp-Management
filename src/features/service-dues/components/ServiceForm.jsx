import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '../../../hooks/useForm';
import { SERVICE_CONSTANTS } from '../../../lib/constants';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Form/Input';
import ServiceService from '../services/serviceService';

/**
 * Service Form component for adding and editing service records
 * @param {Object} props - Component props
 * @returns {JSX.Element} Service form component
 */
const ServiceForm = ({ serviceRecord, vehicle, onSubmit, onCancel }) => {
  const [latestService, setLatestService] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!serviceRecord;

  // Fetch latest service record for the vehicle if needed
  useEffect(() => {
    if (!serviceRecord && vehicle) {
      const fetchLatestService = async () => {
        try {
          setLoading(true);
          const records = await ServiceService.getServiceRecordsByVehicle(vehicle.id);
          if (records && records.length > 0) {
            // Get the latest record
            const latest = records.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at)
            )[0];
            setLatestService(latest);
          }
        } catch (error) {
          console.error('Error loading service record:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchLatestService();
    }
  }, [vehicle, serviceRecord]);

  // Define initial values
  const initialValues = {
    service_date: serviceRecord?.service_date || new Date().toISOString().split('T')[0],
    last_service_km: serviceRecord?.last_service_km || latestService?.current_km || 0,
    current_km: serviceRecord?.current_km || latestService?.current_km || 0
  };

  // Define validation function
  const validate = (values) => {
    const errors = {};

    if (!values.service_date) {
      errors.service_date = 'Service date is required';
    }

    if (!values.last_service_km && values.last_service_km !== 0) {
      errors.last_service_km = 'Last service km is required';
    } else if (isNaN(values.last_service_km) || values.last_service_km < 0) {
      errors.last_service_km = 'Please enter a valid km value';
    }

    if (!values.current_km && values.current_km !== 0) {
      errors.current_km = 'Current km is required';
    } else if (isNaN(values.current_km) || values.current_km < 0) {
      errors.current_km = 'Please enter a valid km value';
    } else if (values.current_km < values.last_service_km) {
      errors.current_km = 'Current km cannot be less than last service km';
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
    setFieldValue,
    setMultipleValues
  } = useForm(initialValues, validate, onSubmit);

  // Calculate next service km
  const nextServiceKm = parseInt(values.current_km) + SERVICE_CONSTANTS.NEXT_SERVICE_KM;

  // Update form values when latestService changes
  useEffect(() => {
    if (latestService && !isEditMode) {
      setMultipleValues({
        last_service_km: latestService.current_km,
        current_km: latestService.current_km
      });
    }
  }, [latestService, setMultipleValues, isEditMode]);

  return (
    <form onSubmit={handleSubmit} className="service-form">
      <div className="form-grid">
        <Input
          name="service_date"
          type="date"
          label="Service Date"
          value={values.service_date}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.service_date && errors.service_date}
          required
        />
        
        <Input
          name="last_service_km"
          type="number"
          label="Last Service KM"
          value={values.last_service_km}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.last_service_km && errors.last_service_km}
          min="0"
          step="1"
          required
          helperText="Last recorded odometer reading at service"
        />
        
        <Input
          name="current_km"
          type="number"
          label="Current KM"
          value={values.current_km}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.current_km && errors.current_km}
          min="0"
          step="1"
          required
          helperText="Current odometer reading"
        />
        
        <div className="info-box">
          <div className="info-title">Next Service</div>
          <div className="info-value">{nextServiceKm.toLocaleString()} km</div>
          <div className="info-text">
            Service is due at {SERVICE_CONSTANTS.NEXT_SERVICE_KM.toLocaleString()} km
            after current reading
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {isEditMode ? 'Update Service Record' : 'Add Service Record'}
        </Button>
      </div>
      
      <style jsx>{`
        .service-form {
          padding: var(--spacing-sm);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .info-box {
          background-color: var(--surface-color);
          padding: var(--spacing-md);
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .info-title {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        
        .info-value {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }
        
        .info-text {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
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

ServiceForm.propTypes = {
  serviceRecord: PropTypes.object,
  vehicle: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ServiceForm;