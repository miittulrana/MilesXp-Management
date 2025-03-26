import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Form.css';

/**
 * Input component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Input component
 */
const Input = forwardRef(({
  id,
  name,
  type = 'text',
  label,
  value,
  placeholder,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  required = false,
  error,
  helperText,
  className = '',
  inputClassName = '',
  labelClassName = '',
  fullWidth = true,
  icon,
  iconPosition = 'left',
  ...rest
}, ref) => {
  const inputWrapperClasses = [
    'form-group',
    fullWidth ? 'form-group-full-width' : '',
    icon ? 'form-group-with-icon' : '',
    icon && iconPosition === 'right' ? 'form-group-icon-right' : 'form-group-icon-left',
    error ? 'form-group-error' : '',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'form-control',
    error ? 'form-control-error' : '',
    inputClassName
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'form-label',
    labelClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={inputWrapperClasses}>
      {label && (
        <label htmlFor={id || name} className={labelClasses}>
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      
      <div className="form-control-wrapper">
        {icon && iconPosition === 'left' && (
          <div className="form-control-icon form-control-icon-left">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
          {...rest}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="form-control-icon form-control-icon-right">
            {icon}
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <div className={`form-text ${error ? 'form-text-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right'])
};

export default Input;