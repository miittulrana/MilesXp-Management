import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '../../../hooks/useForm';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Form/Input';
import { generatePassword, isValidEmail } from '../../../lib/utils';

/**
 * Driver Form component for adding and editing drivers
 * @param {Object} props - Component props
 * @returns {JSX.Element} Driver form component
 */
const DriverForm = ({ driver, onSubmit, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isEditMode = !!driver;

  // Define initial values
  const initialValues = {
    name: driver?.name || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    password: ''
  };

  // Define validation function
  const validate = (values) => {
    const errors = {};

    if (!values.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!values.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(values.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!isEditMode && !values.password.trim()) {
      errors.password = 'Password is required for new drivers';
    } else if (values.password && values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
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

  // Generate a random password
  const handleGeneratePassword = () => {
    const password = generatePassword(12);
    setFieldValue('password', password);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="driver-form">
      <div className="form-grid">
        <Input
          name="name"
          label="Name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && errors.name}
          placeholder="Enter driver name"
          required
        />
        
        <Input
          name="email"
          type="email"
          label="Email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && errors.email}
          placeholder="Enter email address"
          required
          disabled={isEditMode} // Email can't be changed in edit mode
          helperText={isEditMode ? "Email can't be changed" : ""}
        />
        
        <Input
          name="phone"
          type="tel"
          label="Phone"
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.phone && errors.phone}
          placeholder="Enter phone number"
        />
        
        <div className="password-field">
          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            label={isEditMode ? 'New Password (optional)' : 'Password'}
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password}
            placeholder={isEditMode ? 'Enter new password to change' : 'Enter password'}
            required={!isEditMode}
          />
          
          <div className="password-actions">
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="action-button"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="action-button generate-password"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
              </svg>
              Generate
            </button>
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {isEditMode ? 'Update Driver' : 'Add Driver'}
        </Button>
      </div>
      
      <style jsx>{`
        .driver-form {
          padding: var(--spacing-sm);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .password-field {
          position: relative;
          grid-column: span 2;
        }
        
        .password-actions {
          position: absolute;
          top: 35px; /* Position after label */
          right: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .action-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: var(--text-secondary);
          transition: color var(--transition-fast) ease;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .action-button:hover {
          color: var(--text-primary);
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .generate-password {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--primary-color);
          border-radius: var(--border-radius-md);
          padding: 0.25rem 0.5rem;
          font-size: var(--font-size-sm);
        }
        
        .generate-password:hover {
          background-color: rgba(0, 77, 153, 0.1);
          color: var(--primary-color);
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
          
          .password-field {
            grid-column: span 1;
          }
        }
      `}</style>
    </form>
  );
};

DriverForm.propTypes = {
  driver: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default DriverForm;