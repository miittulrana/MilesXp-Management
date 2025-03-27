// src/features/service/ServicePage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import serviceService from './serviceService';
import { useToast } from '../../hooks/useToast';

const ServicePage = () => {
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { showToast, showError } = useToast();
  
  useEffect(() => {
    fetchServiceRecords();
  }, []);
  
  const fetchServiceRecords = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getServiceRecords();
      setServiceRecords(data);
    } catch (error) {
      console.error('Error fetching service records:', error);
      showError('Failed to load service records');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddServiceRecord = () => {
    setIsModalOpen(true);
  };
  
  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      await serviceService.addServiceRecord(formData);
      showToast('Service record added successfully', 'success');
      setIsModalOpen(false);
      fetchServiceRecords();
    } catch (error) {
      console.error('Error saving service record:', error);
      showError('Failed to save service record');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="service-page">
      <div className="page-header">
        <h1>Service Records</h1>
        <Button onClick={handleAddServiceRecord}>Add Service Record</Button>
      </div>
      
      <Card>
        <CardBody>
          {loading ? (
            <p>Loading service records...</p>
          ) : (
            <table className="basic-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Date</th>
                  <th>Last Service KM</th>
                  <th>Current KM</th>
                  <th>Next Service KM</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {serviceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No service records found</td>
                  </tr>
                ) : (
                  serviceRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.vehicle_plate || 'Unknown'}</td>
                      <td>{new Date(record.service_date).toLocaleDateString()}</td>
                      <td>{record.last_service_km.toLocaleString()}</td>
                      <td>{record.current_km.toLocaleString()}</td>
                      <td>{record.next_service_km.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Service Record"
      >
        <p>Service record form would go here</p>
        <Button onClick={() => setIsModalOpen(false)}>Close</Button>
      </Modal>
      
      <style jsx>{`
        .service-page {
          padding: 20px;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .basic-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .basic-table th, .basic-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-badge.completed {
          background-color: #e6f7ee;
          color: #0d9f6e;
        }
        
        .status-badge.due_soon {
          background-color: #fff7e6;
          color: #d97706;
        }
        
        .status-badge.overdue {
          background-color: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default ServicePage;