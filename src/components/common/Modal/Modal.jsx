import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import './Modal.css';

/**
 * Modal component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Modal component
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnOutsideClick = true,
  showCloseButton = true,
  footer,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  preventScroll = true,
  ...rest
}) => {
  const modalRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (preventScroll) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, preventScroll]);

  // Handle outside click
  const handleOverlayClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target) && closeOnOutsideClick) {
      onClose();
    }
  };

  // Combine classNames
  const modalClasses = [
    'modal',
    `modal-${size}`,
    className
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    'modal-overlay',
    isOpen ? 'modal-overlay-open' : '',
    overlayClassName
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'modal-content',
    contentClassName
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'modal-header',
    headerClassName
  ].filter(Boolean).join(' ');

  const bodyClasses = [
    'modal-body',
    bodyClassName
  ].filter(Boolean).join(' ');

  const footerClasses = [
    'modal-footer',
    footerClassName
  ].filter(Boolean).join(' ');

  // Don't render if not open
  if (!isOpen) return null;

  return createPortal(
    <div className={overlayClasses} onClick={handleOverlayClick} {...rest}>
      <div className={modalClasses} ref={modalRef}>
        <div className={contentClasses}>
          {/* Header */}
          <div className={headerClasses}>
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className={bodyClasses}>{children}</div>

          {/* Footer */}
          {footer && <div className={footerClasses}>{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  closeOnOutsideClick: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  footer: PropTypes.node,
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  preventScroll: PropTypes.bool
};

export default Modal;