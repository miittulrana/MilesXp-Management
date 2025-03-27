// src/features/assignments/AssignmentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/common/Card/Card';
import { CardBody } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import assignmentService from './assignmentService';

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast, showError } = useToast();
  
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddAssignment = () => {
    setIsModalOpen(true);
  };
  
  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      await assignmentService.createAssignment(formData);
      showToast('Assignment created successfully', 'success');
      setIsModalOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      showError('Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="assignments-page">
      <div className="page-header">
        <h1>Vehicle Assignments</h1>
        <Button onClick={handleAddAssignment}>New Assignment</Button>
      </div>
      
      <Card>
        <CardBody>
          {loading ? (
            <p>Loading assignments...</p>
          ) : (
            <table className="basic-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No assignments found</td>
                  </tr>
                ) : (
                  assignments.map(assignment => (
                    <tr key={assignment.id}>
                      <td>{assignment.vehicle_plate}</td>
                      <td>{assignment.driver_name}</td>
                      <td>{new Date(assignment.start_date).toLocaleDateString()}</td>
                      <td>{new Date(assignment.end_date).toLocaleDateString()}</td>
                      <td>{assignment.status}</td>
                      <td>
                        <Button size="small" variant="outline">Edit</Button>
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
        title="New Assignment"
      >
        <p>Assignment form would go here</p>
        <Button onClick={() => setIsModalOpen(false)}>Close</Button>
      </Modal>
    </div>
  );
};

export default AssignmentsPage;