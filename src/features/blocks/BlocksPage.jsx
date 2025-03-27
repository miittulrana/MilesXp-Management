// src/features/blocks/BlocksPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import blockService from './blockService';
import { useToast } from '../../hooks/useToast';

const BlocksPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast, showError } = useToast();
  
  useEffect(() => {
    fetchBlocks();
  }, []);
  
  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const data = await blockService.getBlocks();
      setBlocks(data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      showError('Failed to load vehicle blocks');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddBlock = () => {
    setIsModalOpen(true);
  };
  
  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      await blockService.createBlock(formData);
      showToast('Vehicle blocked successfully', 'success');
      setIsModalOpen(false);
      fetchBlocks();
    } catch (error) {
      console.error('Error saving block:', error);
      showError('Failed to save vehicle block');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteBlock = async (blockId) => {
    if (!window.confirm('Are you sure you want to mark this block as completed?')) {
      return;
    }
    
    try {
      setLoading(true);
      await blockService.completeBlock(blockId);
      showToast('Vehicle block marked as completed', 'success');
      fetchBlocks();
    } catch (error) {
      console.error('Error completing block:', error);
      showError('Failed to complete vehicle block');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="blocks-page">
      <div className="page-header">
        <h1>Block Vehicles</h1>
        <Button onClick={handleAddBlock}>Block Vehicle</Button>
      </div>
      
      <Card>
        <CardBody>
          {loading ? (
            <p>Loading vehicle blocks...</p>
          ) : (
            <table className="basic-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blocks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No vehicle blocks found</td>
                  </tr>
                ) : (
                  blocks.map(block => (
                    <tr key={block.id}>
                      <td>{block.vehicle_plate}</td>
                      <td>{new Date(block.start_date).toLocaleDateString()}</td>
                      <td>{new Date(block.end_date).toLocaleDateString()}</td>
                      <td>{block.reason}</td>
                      <td>{block.status}</td>
                      <td>
                        {block.status === 'active' && (
                          <Button 
                            size="small" 
                            variant="success" 
                            onClick={() => handleCompleteBlock(block.id)}
                          >
                            Complete
                          </Button>
                        )}
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
        title="Block Vehicle"
      >
        <p>Block form would go here</p>
        <Button onClick={() => setIsModalOpen(false)}>Close</Button>
      </Modal>
    </div>
  );
};

export default BlocksPage;