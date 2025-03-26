import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '../../../hooks/useForm';
import { DOCUMENT_TYPES, ENTITY_TYPES } from '../../../lib/constants';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Form/Input';
import Select from '../../../components/common/Form/Select';
import DocumentUpload from './DocumentUpload';
import VehicleService from '../../vehicles/services/vehicleService';
import DriverService from '../../drivers/services/driverService';

/**
 * Document Form component for adding and editing documents
 * @param {Object} props - Component props
 * @returns {JSX.Element} Document form component
 */
const DocumentForm = ({ 
  document, 
  entityType, 
  entityId, 
  onSubmit, 
  onCancel 
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!document;

  // Initial entity type and id
  const initialEntityType = entityType || document?.entity_type || '';
  const initialEntityId = entityId || document?.entity_id || '';

  // Define initial values
  const initialValues = {
    name: document?.name || '',
    type: document?.type || '',
    entity_type: initialEntityType,
    entity_id: initialEntityId,
    issue_date: document?.issue_date || new Date().toISOString().split('T')[0],
    expiry_date: document?.expiry_date || ''
  };

  // Define validation function
  const validate = (values) => {
    const errors = {};

    if (!values.name.trim()) {
      errors.name = 'Document name is required';
    }

    if (!values.type) {
      errors.type = 'Document type is required';
    }

    if (!values.entity_type) {
      errors.entity_type = 'Entity type is required';
    }

    if (!values.entity_id) {
      errors.entity_id = 'Please select a specific entity';
    }

    if (!values.issue_date) {
      errors.issue_date = 'Issue date is required';
    }

    if (!values.expiry_date) {
      errors.expiry_date = 'Expiry date is required';
    } else if (new Date(values.expiry_date) <= new Date(values.issue_date)) {
      errors.expiry_date = 'Expiry date must be after issue date';
    }

    if (!isEditMode && !selectedFile) {
      errors.file = 'Please upload a document file';
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
  } = useForm(initialValues, validate, handleFormSubmit);

  // Fetch vehicles and drivers for selection
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles if needed or not provided through entityType/entityId
        if (!entityType || entityType === ENTITY_TYPES.VEHICLE) {
          const vehicleData = await VehicleService.getVehicles();
          setVehicles(vehicleData);
        }
        
        // Fetch drivers if needed or not provided through entityType/entityId
        if (!entityType || entityType === ENTITY_TYPES.DRIVER) {
          const driverData = await DriverService.getDrivers();
          setDrivers(driverData);
        }
      } catch (error) {
        console.error('Error loading entities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [entityType, entityId]);

  // Handle file selection
  const handleFileChange = (file) => {
    setSelectedFile(file);
  };

  // Handle form submission with file
  async function handleFormSubmit(formValues) {
    // Combine form values and selected file for submission
    await onSubmit(formValues, selectedFile);
  }

  // Get document type options based on entity type
  const getDocumentTypeOptions = () => {
    if (values.entity_type === ENTITY_TYPES.VEHICLE) {
      return [
        { value: DOCUMENT_TYPES.INSURANCE, label: 'Insurance' },
        { value: DOCUMENT_TYPES.VRT_TAG, label: 'VRT Tag' },
        { value: DOCUMENT_TYPES.LOGBOOK, label: 'Logbook' }
      ];
    } else if (values.entity_type === ENTITY_TYPES.DRIVER) {
      return [
        { value: DOCUMENT_TYPES.ID, label: 'ID Card' },
        { value: DOCUMENT_TYPES.LICENSE, label: 'Driver License' }
      ];
    }
    return [];
  };

  // Get entity options based on entity type
  const getEntityOptions = () => {
    if (values.entity_type === ENTITY_TYPES.VEHICLE) {
      return vehicles.map(vehicle => ({
        value: vehicle.id,
        label: `${vehicle.plate_number} - ${vehicle.model}`
      }));
    } else if (values.entity_type === ENTITY_TYPES.DRIVER) {
      return drivers.map(driver => ({
        value: driver.id,
        label: driver.name
      }));
    }
    return [];
  };

  // Entity type options
  const entityTypeOptions = [
    { value: ENTITY_TYPES.VEHICLE, label: 'Vehicle' },
    { value: ENTITY_TYPES.DRIVER, label: 'Driver' }
  ];

  return (
    <form onSubmit={handleSubmit} className="document-form">
      <div className="form-grid">
        <Input
          name="name"
          label="Document Name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && errors.name}
          placeholder="Enter document name"
          required
        />
        
        {/* Only show entity type selection if not provided through props */}
        {!entityType && (
          <Select
            name="entity_type"
            label="Entity Type"
            value={values.entity_type}
            onChange={(e) => {
              handleChange(e);
              // Reset entity_id when entity_type changes
              setFieldValue('entity_id', '');
              // Reset type when entity_type changes
              setFieldValue('type', '');
            }}
            onBlur={handleBlur}
            error={touched.entity_type && errors.entity_type}
            options={entityTypeOptions}
            required
            disabled={isEditMode} // Can't change entity type in edit mode
          />
        )}
        
        {/* Only show entity selection if entity type is selected and not provided through props */}
        {values.entity_type && !entityId && (
          <Select
            name="entity_id"
            label={values.entity_type === ENTITY_TYPES.VEHICLE ? 'Vehicle' : 'Driver'}
            value={values.entity_id}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.entity_id && errors.entity_id}
            options={getEntityOptions()}
            required
            disabled={isEditMode || loading} // Can't change entity in edit mode
            helperText={loading ? `Loading ${values.entity_type}s...` : ''}
          />
        )}
        
        {/* Only show document type selection if entity type is selected */}
        {values.entity_type && (
          <Select
            name="type"
            label="Document Type"
            value={values.type}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.type && errors.type}
            options={getDocumentTypeOptions()}
            required
          />
        )}
        
        <Input
          name="issue_date"
          type="date"
          label="Issue Date"
          value={values.issue_date}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.issue_date && errors.issue_date}
          required
        />
        
        <Input
          name="expiry_date"
          type="date"
          label="Expiry Date"
          value={values.expiry_date}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.expiry_date && errors.expiry_date}
          required
          min={values.issue_date}
        />
        
        <div className={`upload-section ${isEditMode ? 'upload-edit-mode' : ''}`}>
          <DocumentUpload
            onFileChange={handleFileChange}
            error={touched.file && errors.file}
            isRequired={!isEditMode}
            fileName={selectedFile?.name || (document ? 'Current file' : '')}
          />
          
          {isEditMode && !selectedFile && (
            <div className="current-file-notice">
              <p>Current file will be kept if no new file is uploaded</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {isEditMode ? 'Update Document' : 'Add Document'}
        </Button>
      </div>
      
      <style jsx>{`
        .document-form {
          padding: var(--spacing-sm);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .upload-section {
          grid-column: span 2;
          margin-top: var(--spacing-sm);
        }
        
        .upload-edit-mode {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .current-file-notice {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          font-style: italic;
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
          
          .upload-section {
            grid-column: span 1;
          }
        }
      `}</style>
    </form>
  );
};

DocumentForm.propTypes = {
  document: PropTypes.object,
  entityType: PropTypes.string,
  entityId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default DocumentForm;