import React from 'react';
import PropTypes from 'prop-types';
import Card, { CardHeader, CardBody, CardFooter } from '../../../components/common/Card/Card';
import Input from '../../../components/common/Form/Input';
import Select from '../../../components/common/Form/Select';
import Button from '../../../components/common/Button/Button';
import { useForm } from '../../../hooks/useForm';
import { ROLES } from '../../../lib/constants';
import { isValidEmail } from '../../../lib/utils';

/**
 * User Form component for creating and editing users
 * @param {Object} props - Component props
 * @returns {JSX.Element} User form component
 */
const UserForm = ({
  user = null,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const isEdit = !!user;
  
  // Form validation
  const validateForm = (values) => {
    const errors = {};
    
    if (!values.name) {
      errors.name = 'Name is required';
    }
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(values.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (values.phone && !/^\+?[0-9\s-()]+$/.test(values.phone)) {
      errors.phone = 'Invalid phone number';
    }
    
    if (!values.role) {
      errors.role = 'Role is required';
    }
    
    return errors;
  };
  
  // Initialize form with user data or empty values
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = 
    useForm(
      {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        role: user?.role || ROLES.DRIVER
      },
      validateForm,
      onSubmit
    );
  
  // Role options
  const roleOptions = [
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.DRIVER, label: 'Driver' }
  ];
  
  return (
    <Card>
      <CardHeader title={isEdit ? 'Edit User' : 'Create New User'} />
      <CardBody>
        <form onSubmit={handleSubmit} id="user-form">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              name="name"
              label="Name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name && errors.name}
              required
              disabled={loading}
            />
            
            <Input
              name="email"
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              required
              disabled={loading || isEdit} // Email can't be changed in edit mode
            />
            
            <Input
              name="phone"
              label="Phone"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone && errors.phone}
              disabled={loading}
            />
            
            <Select
              name="role"
              label="Role"
              value={values.role}
              options={roleOptions}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.role && errors.role}
              required
              disabled={loading}
            />
          </div>
          
          {isEdit && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              <p className="text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Password can be reset from the user details page.
              </p>
            </div>
          )}
        </form>
      </CardBody>
      <CardFooter>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="user-form"
            loading={loading || isSubmitting}
            disabled={loading || isSubmitting}
          >
            {isEdit ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

UserForm.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string,
    role: PropTypes.string.isRequired
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default UserForm;