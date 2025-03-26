import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

/**
 * Card component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Card component
 */
const Card = ({
  children,
  className = '',
  hoverable = false,
  ...rest
}) => {
  const cardClasses = [
    'card',
    hoverable ? 'card-hoverable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...rest}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hoverable: PropTypes.bool
};

/**
 * Card header component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Card header component
 */
export const CardHeader = ({
  children,
  className = '',
  title,
  action,
  ...rest
}) => {
  const headerClasses = [
    'card-header',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={headerClasses} {...rest}>
      {title && <div className="card-title">{title}</div>}
      {children}
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
};

CardHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.node,
  action: PropTypes.node
};

/**
 * Card body component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Card body component
 */
export const CardBody = ({
  children,
  className = '',
  ...rest
}) => {
  const bodyClasses = [
    'card-body',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={bodyClasses} {...rest}>
      {children}
    </div>
  );
};

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

/**
 * Card footer component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Card footer component
 */
export const CardFooter = ({
  children,
  className = '',
  ...rest
}) => {
  const footerClasses = [
    'card-footer',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={footerClasses} {...rest}>
      {children}
    </div>
  );
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Card;