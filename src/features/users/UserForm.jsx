import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../../components/common/Form/Input';
import Select from '../../components/common/Form/Select';
import Button from '../../components/common/Button/Button';
import { ROLES } from '../../lib/constants';

/**
 * User form component for adding and editing user information
 */
const UserForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEdit = false
}) => {
  // Set default values
  const defaultValues = {
    name: '',
    email: '',
    phone: '',
    role: ROLES.DRIVER,
    password: ''
  };
  
  const [formValues, setFormValues] = useState({...defaultValues, ...initialValues});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update form values when initialValues change
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormValues({...defaultValues, ...initialValues});
    }
  }, [initialValues]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to: ${value}`);
    
    // Update form values
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle input blur for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate the field
    validateField(name, formValues[name]);
  };

  // Validate a field
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          error = 'Name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;
      
      case 'email':
        if (!isEdit) { // Only validate email for new users
          if (!value || value.trim() === '') {
            error = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(value)) {
            error = 'Please enter a valid email address';
          }
        }
        break;
        
      case 'phone':
        // Phone is optional but validate format if provided
        if (value && value.trim() !== '' && !/^[\d\s\-\+\(\)]{7,20}$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;

      case 'role':
        if (!value) {
          error = 'Role is required';
        }
        break;
        
      case 'password':
        if (!isEdit && (!value || value.trim() === '')) {
          error = 'Password is required';
        } else if (!isEdit && value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
        
      default:
        break;
    }

    // Update errors state
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return !error;
  };

  // Validate the entire form
  const validateForm = () => {
    const fields = ['name', 'role'];
    if (!isEdit) fields.push('email', 'password');
    
    let isValid = true;
    const newErrors = {};
    const newTouched = {...touched};
    
    // Validate each required field
    fields.forEach(field => {
      newTouched[field] = true;
      if (!validateField(field, formValues[field])) {
        isValid = false;
        newErrors[field] = errors[field] || `This field is required`;
      }
    });
    
    setTouched(newTouched);
    setErrors({...errors, ...newErrors});
    
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted, values:', formValues);
    
    if (validateForm()) {
      console.log('Form validation passed, submitting data');
      // Pass a copy of the data to avoid reference issues
      onSubmit({...formValues});
    } else {
      console.log('Form validation failed, not submitting');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <Input
        label="Name"
        name="name"
        value={formValues.name || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.name && errors.name}
        required
      />
      
      <Input
        label="Email"
        name="email"
        type="email"
        value={formValues.email || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={isEdit}
        error={touched.email && errors.email}
        helperText={isEdit ? "Email cannot be changed" : ""}
        required={!isEdit}
      />
      
      <Input
        label="Phone"
        name="phone"
        value={formValues.phone || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone && errors.phone}
        helperText="Optional"
      />
      
      <Select
        label="Role"
        name="role"
        value={formValues.role || ROLES.DRIVER}
        onChange={handleChange}
        onBlur={handleBlur}
        options={[
          { value: ROLES.ADMIN, label: 'Admin' },
          { value: ROLES.DRIVER, label: 'Driver' }
        ]}
        error={touched.role && errors.role}
        required
      />

      {/* Always show password field */}
      <Input
        label="Password"
        name="password"
        type="text" // Changed from password type to text type so it's visible
        value={formValues.password || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password && errors.password}
        helperText={isEdit ? "Current user password" : "Enter a password with at least 6 characters"}
        required={!isEdit}
        readOnly={isEdit} // Make it read-only in edit mode
      />
      
      <div className="flex justify-end gap-2 mt-6">
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
          {isEdit ? 'Update User' : 'Add User'}
        </Button>
      </div>
    </form>
  );
};

UserForm.propTypes = {
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    role: PropTypes.string,
    password: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isEdit: PropTypes.bool
};

export default UserForm;