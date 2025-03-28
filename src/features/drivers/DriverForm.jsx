import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../../components/common/Form/Input';
import Button from '../../components/common/Button/Button';
import { isValidEmail } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';

/**
 * Driver form component for viewing and basic editing of driver information
 * Note: Most editing functionality is redirected to the Users management
 */
const DriverForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
  isEditMode = false,
  readOnly = false
}) => {
  const navigate = useNavigate();
  
  // Default values with fallbacks
  const defaultValues = {
    name: '',
    email: '',
    phone: '',
    ...initialValues
  };
  
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update values when initialValues change
  useEffect(() => {
    setValues({
      name: '',
      email: '',
      phone: '',
      ...initialValues
    });
  }, [initialValues]);

  // Handle input change
  const handleChange = (e) => {
    if (readOnly) return;
    
    const { name, value } = e.target;
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));

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
    if (readOnly) return;
    
    const { name } = e.target;
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
    
    validateField(name, values[name]);
  };

  // Validate a single field
  const validateField = (name, value) => {
    let fieldError = '';

    switch (name) {
      case 'name':
        if (!value.trim()) {
          fieldError = 'Name is required';
        } else if (value.length < 2) {
          fieldError = 'Name must be at least 2 characters';
        }
        break;
      
      case 'email':
        if (!isEditMode) { // Only validate email in add mode
          if (!value.trim()) {
            fieldError = 'Email is required';
          } else if (!isValidEmail(value)) {
            fieldError = 'Please enter a valid email address';
          }
        }
        break;

      case 'phone':
        // Phone is optional, but if provided, should be valid
        if (value && !/^[\d\s\-\+\(\)]{7,20}$/.test(value)) {
          fieldError = 'Please enter a valid phone number';
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
      onSubmit(values);
    }
  };

  // Redirect to user management for comprehensive editing
  const handleRedirectToUserManagement = () => {
    navigate(ROUTES.USERS);
  };

  return (
    <form onSubmit={handleSubmit} className="driver-form p-4">
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && errors.name}
          required
          readOnly={readOnly}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && errors.email}
          required={!isEditMode}
          disabled={isEditMode || readOnly}
          helperText={isEditMode ? "Email cannot be changed" : ""}
        />

        <Input
          label="Phone"
          name="phone"
          value={values.phone || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.phone && errors.phone}
          placeholder="Optional"
          readOnly={readOnly}
        />
        
        {readOnly && (
          <div className="bg-surface-color p-3 mt-2 rounded border border-border-color text-sm text-gray-600">
            <p className="font-medium mb-2">Editing Driver Information</p>
            <p>Driver details are managed through the User Management section. This ensures consistent user information across the system.</p>
            <Button 
              variant="primary"
              size="small"
              className="mt-2"
              onClick={handleRedirectToUserManagement}
            >
              Go to User Management
            </Button>
          </div>
        )}
      </div>

      {!readOnly && (
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
      )}
    </form>
  );
};

DriverForm.propTypes = {
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string
  }),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isSubmitting: PropTypes.bool,
  submitLabel: PropTypes.string,
  isEditMode: PropTypes.bool,
  readOnly: PropTypes.bool
};

export default DriverForm;