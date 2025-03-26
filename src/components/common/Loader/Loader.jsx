import React from 'react';
import PropTypes from 'prop-types';
import './Loader.css';

/**
 * Loader component for displaying loading states
 * @param {Object} props - Component props
 * @returns {JSX.Element} Loader component
 */
const Loader = ({
  size = 'medium',
  color = 'primary',
  fullScreen = false,
  overlay = false,
  text = 'Loading...',
  showText = true,
  className = '',
  ...rest
}) => {
  const loaderClasses = [
    'loader',
    `loader-${size}`,
    `loader-${color}`,
    fullScreen ? 'loader-fullscreen' : '',
    overlay ? 'loader-overlay' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={loaderClasses} {...rest}>
      <div className="loader-spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {showText && text && <div className="loader-text">{text}</div>}
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  fullScreen: PropTypes.bool,
  overlay: PropTypes.bool,
  text: PropTypes.string,
  showText: PropTypes.bool,
  className: PropTypes.string
};

export default Loader;