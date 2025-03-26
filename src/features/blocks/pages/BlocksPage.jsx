import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import BlockList from '../components/BlockList';
import BlockForm from '../components/BlockForm';
import BlockService from '../services/blockService';
import VehicleService from '../../vehicles/services/vehicleService';

/**
 * Blocks page component for managing vehicle blocks
 * @returns {JSX.Element} Blocks page component
 */
const BlocksPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const { showToast, showError } = useToast();
  const location = useLocation();
  
  // Parse query params for vehicle filter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const vehicleId = searchParams.get('vehicleId');
    
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
  }, [location.search]);
  
  // Fetch blocks
  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      let blocksData;
      
      if (filterVehicleId) {
        // Fetch blocks for specific vehicle
        blocksData = await BlockService.getBlocksByVehicle(filterVehicleId);
      } else {
        // Fetch all blocks
        blocksData = await BlockService.getBlocks();
      }
      
      setBlocks(blocksData);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      showError('Failed to load vehicle blocks');
    } finally {
      setLoading(false);
    }
  }, [filterVehicleId, showError]);
  
  // Initial fetch
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);
  
  // Handle adding new block
  const handleAddBlock = () => {
    setSelectedBlock(null);
    setIsModalOpen(true);
  };
  
  // Handle editing block
  const handleEditBlock = (block) => {
    setSelectedBlock(block);
    setIsModalOpen(true);
  };
  
  // Handle completing block
  const handleCompleteBlock = async (block) => {
    if (!window.confirm('Are you sure you want to mark this block as completed?')) {
      return;
    }
    
    try {
      setLoading(true);
      await BlockService.completeBlock(block.id);
      showToast('Vehicle block marked as completed', 'success');
      fetchBlocks();
    } catch (error) {
      console.error('Error completing block:', error);
      showError('Failed to complete vehicle block');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      
      if (selectedBlock) {
        // Update existing block
        await BlockService.updateBlock(selectedBlock.id, formData);
        showToast('Vehicle block updated successfully', 'success');
      } else {
        // Create new block
        await BlockService.createBlock(formData);
        showToast('Vehicle blocked successfully', 'success');
      }
      
      setIsModalOpen(false);
      fetchBlocks();
    } catch (error) {
      console.error('Error saving block:', error);
      showError(error.message || 'Failed to save vehicle block');
    } finally {
      setLoading(false);
    }
  };
  
  // Clear filters
  const clearFilters = () => {
    // Update URL to remove filters
    const url = new URL(window.location);
    url.searchParams.delete('vehicleId');
    window.history.pushState({}, '', url);
    
    // Clear state
    setFilterVehicleId('');
    setSelectedVehicle(null);
  };
  
  return (
    <div className="blocks-page">
      <div className="page-header">
        <h1>
          {filterVehicleId ? 'Vehicle Blocks' : 'Block Vehicles'}
        </h1>
        
        {filterVehicleId && selectedVehicle && (
          <div className="filter-info">
            <div className="entity-filter">
              <span className="filter-label">Vehicle:</span>
              <span className="filter-value">{selectedVehicle.plate_number} - {selectedVehicle.model}</span>
            </div>
            
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
          {loading && blocks.length === 0 ? (
            <div className="loading-container">
              <Loader size="large" text="Loading vehicle blocks..." />
            </div>
          ) : (
            <BlockList
              blocks={blocks}
              loading={loading}
              onAddBlock={handleAddBlock}
              onEdit={handleEditBlock}
              onComplete={handleCompleteBlock}
              showVehicleInfo={!filterVehicleId}
            />
          )}
        </CardBody>
      </Card>
      
      {/* Block Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBlock ? 'Edit Vehicle Block' : 'Block Vehicle'}
        size="medium"
      >
        <BlockForm
          block={selectedBlock}
          vehicleId={filterVehicleId}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      
      <style jsx>{`
        .blocks-page {
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

export default BlocksPage;