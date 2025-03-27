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
  // Set default values with fallbacks
  const defaultValues = {
    name: '',
    email: '',
    phone: '',
    role: ROLES.DRIVER,
    ...initialValues
  };
  
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update form values when initialValues change
  useEffect(() => {
    setValues({
      name: '',
      email: '',
      phone: '',
      role: ROLES.DRIVER,
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

    // Clear error if field was in error
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

  // Validate a field
  const validateField = (name, value) => {
    let fieldError = '';

    switch (name) {
      case 'name':
        if (!value || !value.trim()) {
          fieldError = 'Name is required';
        }
        break;
      
      case 'email':
        if (!isEdit) { // Only validate email for new users
          if (!value || !value.trim()) {
            fieldError = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(value)) {
            fieldError = 'Email is invalid';
          }
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

  // Validate the form
  const validateForm = () => {
    const fieldsToValidate = ['name', 'role'];
    if (!isEdit) fieldsToValidate.push('email');
    
    let formIsValid = true;
    const newErrors = {};
    const newTouched = {...touched};
    
    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
      const isValid = validateField(field, values[field]);
      if (!isValid) {
        formIsValid = false;
        newErrors[field] = errors[field] || `${field} is invalid`;
      }
    });
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    return formIsValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
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
        disabled={isEdit}
        error={touched.email && errors.email}
        helperText={isEdit ? "Email cannot be changed" : ""}
        required={!isEdit}
      />
      
      <Input
        label="Phone"
        name="phone"
        value={values.phone || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone && errors.phone}
      />
      
      <Select
        label="Role"
        name="role"
        value={values.role}
        onChange={handleChange}
        onBlur={handleBlur}
        options={[
          { value: ROLES.ADMIN, label: 'Admin' },
          { value: ROLES.DRIVER, label: 'Driver' }
        ]}
        error={touched.role && errors.role}
        required
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
    role: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isEdit: PropTypes.bool
};

export default UserForm;