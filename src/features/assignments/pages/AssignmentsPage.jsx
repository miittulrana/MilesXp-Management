import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import AssignmentList from '../components/AssignmentList';
import AssignmentForm from '../components/AssignmentForm';
import AssignmentService from '../services/assignmentService';
import VehicleService from '../../vehicles/services/vehicleService';
import DriverService from '../../drivers/services/driverService';

/**
 * Assignments page component for managing vehicle assignments
 * @returns {JSX.Element} Assignments page component
 */
const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterDriverId, setFilterDriverId] = useState('');
  const { showToast, showError } = useToast();
  const location = useLocation();
  
  // Parse query params for vehicle or driver filters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const vehicleId = searchParams.get('vehicleId');
    const driverId = searchParams.get('driverId');
    
    if (vehicleId) {
      setFilterVehicleId(vehicleId);
      
      // Fetch vehicle details for later use
      const fetchVehicle = async () => {
        try {
          const vehicle = await VehicleService.getVehicleById(vehicleId);
          setSelectedVehicle(vehicle);
        } catch (error) {
          console.error('Error fetching vehicle:', error);
        }
      };
      
      fetchVehicle();
    }
    
    if (driverId) {
      setFilterDriverId(driverId);
      
      // Fetch driver details for later use
      const fetchDriver = async () => {
        try {
          const driver = await DriverService.getDriverById(driverId);
          setSelectedDriver(driver);
        } catch (error) {
          console.error('Error fetching driver:', error);
        }
      };
      
      fetchDriver();
    }
  }, [location.search]);
  
  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      let assignmentsData;
      
      if (filterVehicleId) {
        // Fetch assignments for specific vehicle
        assignmentsData = await AssignmentService.getAssignmentsByVehicle(filterVehicleId);
      } else if (filterDriverId) {
        // Fetch assignments for specific driver
        assignmentsData = await AssignmentService.getAssignmentsByDriver(filterDriverId);
      } else {
        // Fetch all assignments
        assignmentsData = await AssignmentService.getAssignments();
      }
      
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [filterVehicleId, filterDriverId, showError]);
  
  // Initial fetch
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);
  
  // Handle adding new assignment
  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    setIsModalOpen(true);
  };
  
  // Handle editing assignment
  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };
  
  // Handle completing assignment
  const handleCompleteAssignment = async (assignment) => {
    if (!window.confirm('Are you sure you want to mark this assignment as completed?')) {
      return;
    }
    
    try {
      setLoading(true);
      await AssignmentService.updateAssignmentStatus(assignment.id, 'completed');
      showToast('Assignment marked as completed', 'success');
      fetchAssignments();
    } catch (error) {
      console.error('Error completing assignment:', error);
      showError('Failed to complete assignment');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancelling assignment
  const handleCancelAssignment = async (assignment) => {
    if (!window.confirm('Are you sure you want to cancel this assignment?')) {
      return;
    }
    
    try {
      setLoading(true);
      await AssignmentService.updateAssignmentStatus(assignment.id, 'cancelled');
      showToast('Assignment cancelled successfully', 'success');
      fetchAssignments();
    } catch (error) {
      console.error('Error cancelling assignment:', error);
      showError('Failed to cancel assignment');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      
      if (selectedAssignment) {
        // Update existing assignment
        await AssignmentService.updateAssignment(selectedAssignment.id, formData);
        showToast('Assignment updated successfully', 'success');
      } else {
        // Create new assignment
        await AssignmentService.createAssignment(formData);
        showToast('Assignment created successfully', 'success');
      }
      
      setIsModalOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      showError(error.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };
  
  // Clear filters
  const clearFilters = () => {
    // Update URL to remove filters
    const url = new URL(window.location);
    url.searchParams.delete('vehicleId');
    url.searchParams.delete('driverId');
    window.history.pushState({}, '', url);
    
    // Clear state
    setFilterVehicleId('');
    setFilterDriverId('');
    setSelectedVehicle(null);
    setSelectedDriver(null);
  };
  
  return (
    <div className="assignments-page">
      <div className="page-header">
        <h1>
          {filterVehicleId 
            ? 'Vehicle Assignments' 
            : filterDriverId 
              ? 'Driver Assignments' 
              : 'Vehicle Assignments'}
        </h1>
        
        {(filterVehicleId || filterDriverId) && (
          <div className="filter-info">
            {filterVehicleId && selectedVehicle && (
              <div className="entity-filter">
                <span className="filter-label">Vehicle:</span>
                <span className="filter-value">{selectedVehicle.plate_number} - {selectedVehicle.model}</span>
              </div>
            )}
            
            {filterDriverId && selectedDriver && (
              <div className="entity-filter">
                <span className="filter-label">Driver:</span>
                <span className="filter-value">{selectedDriver.name}</span>
              </div>
            )}
            
            <button className="clear-filter" onClick={clearFilters}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Clear Filter
            </button>
          </div>
        )}
      </div>
      
      <Card>
        <CardBody>
          {loading && assignments.length === 0 ? (
            <div className="loading-container">
              <Loader size="large" text="Loading assignments..." />
            </div>
          ) : (
            <AssignmentList
              assignments={assignments}
              loading={loading}
              onAddAssignment={handleAddAssignment}
              onEdit={handleEditAssignment}
              onCancel={handleCancelAssignment}
              onComplete={handleCompleteAssignment}
              showVehicleInfo={!filterVehicleId}
              showDriverInfo={!filterDriverId}
            />
          )}
        </CardBody>
      </Card>
      
      {/* Assignment Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAssignment ? 'Edit Assignment' : 'New Assignment'}
        size="medium"
      >
        <AssignmentForm
          assignment={selectedAssignment}
          vehicleId={filterVehicleId}
          driverId={filterDriverId}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      
      <style jsx>{`
        .assignments-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .page-header h1 {
          margin: 0;
          font-size: var(--font-size-2xl);
          color: var(--primary-color);
        }
        
        .filter-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          background-color: var(--surface-color);
          padding: 0.5rem 1rem;
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
        }
        
        .entity-filter {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .filter-label {
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .filter-value {
          font-weight: 600;
        }
        
        .clear-filter {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background: none;
          border: none;
          color: var(--error-color);
          cursor: pointer;
          font-size: var(--font-size-sm);
          padding: 0.25rem 0.5rem;
          border-radius: var(--border-radius-sm);
        }
        
        .clear-filter:hover {
          background-color: rgba(220, 53, 69, 0.1);
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }
        
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
          
          .filter-info {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AssignmentsPage;