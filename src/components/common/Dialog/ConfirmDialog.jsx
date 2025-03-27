import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';

/**
 * Confirmation dialog component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Confirmation dialog component
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={!isLoading ? onClose : undefined}
      title={title}
      closeOnOutsideClick={!isLoading}
      showCloseButton={!isLoading}
    >
      <div className="p-4">
        <p className="mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  confirmVariant: PropTypes.string,
  isLoading: PropTypes.bool
};

export default ConfirmDialog;