import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Form.css';

/**
 * Select component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Select component
 */
const Select = forwardRef(({
  id,
  name,
  label,
  value,
  options = [],
  onChange,
  onBlur,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  selectClassName = '',
  labelClassName = '',
  fullWidth = true,
  placeholder = 'Select an option',
  ...rest
}, ref) => {
  const selectWrapperClasses = [
    'form-group',
    fullWidth ? 'form-group-full-width' : '',
    error ? 'form-group-error' : '',
    className
  ].filter(Boolean).join(' ');

  const selectClasses = [
    'form-control',
    'form-select',
    error ? 'form-control-error' : '',
    selectClassName
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'form-label',
    labelClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={selectWrapperClasses}>
      {label && (
        <label htmlFor={id || name} className={labelClasses}>
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      
      <div className="form-control-wrapper">
        <select
          ref={ref}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={selectClasses}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          
          {options.map(option => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        
        <div className="form-select-arrow"></div>
      </div>
      
      {(helperText || error) && (
        <div className={`form-text ${error ? 'form-text-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
      })
    ])
  ),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  selectClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  fullWidth: PropTypes.bool,
  placeholder: PropTypes.string
};

export default Select;