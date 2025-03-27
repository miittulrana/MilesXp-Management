import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../../components/common/Form/Input';
import Button from '../../components/common/Button/Button';
import { isValidEmail } from '../../lib/utils';

/**
 * Driver form component for adding and editing driver information
 */
const DriverForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
  isEditMode = false
}) => {
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

  return (
    <form onSubmit={handleSubmit} className="driver-form">
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && errors.name}
          required
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
          disabled={isEditMode}
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
        />
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

DriverForm.propTypes = {
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  submitLabel: PropTypes.string,
  isEditMode: PropTypes.bool
};

export default DriverForm;