import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/utils';
import driverService from './driverService';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import DataTable from '../../components/common/DataTable/DataTable';

/**
 * Driver Detail Page
 */
const DriverDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast, showError } = useToast();
  
  // Driver data state
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('details'); // details, assignments, documents

  // Fetch driver details and related data
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);
        // Fetch driver details
        const driverData = await driverService.getDriverById(id);
        setDriver(driverData);
        
        // Fetch driver assignments
        setLoadingAssignments(true);
        try {
          const assignmentsData = await driverService.getDriverAssignments(id);
          setAssignments(assignmentsData || []);
        } catch (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
        } finally {
          setLoadingAssignments(false);
        }
        
        // Fetch driver documents
        setLoadingDocuments(true);
        try {
          const documentsData = await driverService.getDriverDocuments(id);
          setDocuments(documentsData || []);
        } catch (documentError) {
          console.error('Error fetching documents:', documentError);
        } finally {
          setLoadingDocuments(false);
        }
      } catch (error) {
        console.error('Error fetching driver details:', error);
        showError('Failed to load driver details: ' + (error.message || ''));
        navigate(ROUTES.DRIVERS);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [id, navigate, showError]);

  // Navigate to user management for editing
  const handleEditInUserManagement = () => {
    showToast('Redirecting to User Management for editing', 'info');
    navigate(ROUTES.USERS);
  };

  // Handle vehicle assignment
  const handleAssignVehicle = () => {
    navigate(`${ROUTES.ASSIGN_VEHICLE}?driverId=${id}`);
  };

  // Handle document management
  const handleManageDocuments = () => {
    navigate(`${ROUTES.DOCUMENTS}?entityType=driver&entityId=${id}`);
  };

  // Return to drivers list
  const handleBackClick = () => {
    navigate(ROUTES.DRIVERS);
  };

  // Assignments table columns
  const assignmentColumns = [
    {
      field: 'start_date',
      title: 'Start Date',
      render: (value) => formatDate(value)
    },
    {
      field: 'end_date',
      title: 'End Date',
      render: (value) => value ? formatDate(value) : 'Active'
    },
    {
      field: 'vehicle',
      title: 'Vehicle',
      render: (value) => value ? `${value.plate_number} (${value.model})` : '-'
    },
    {
      field: 'status',
      title: 'Status',
      render: (value) => (
        <span className={`status-badge ${value}`}>
          {value}
        </span>
      )
    }
  ];

  // Documents table columns
  const documentColumns = [
    {
      field: 'name',
      title: 'Document Name'
    },
    {
      field: 'type',
      title: 'Type'
    },
    {
      field: 'issue_date',
      title: 'Issue Date',
      render: (value) => formatDate(value)
    },
    {
      field: 'expiry_date',
      title: 'Expiry Date',
      render: (value) => formatDate(value)
    },
    {
      field: 'status',
      title: 'Status',
      render: (value) => (
        <span className={`status-badge ${value}`}>
          {value}
        </span>
      )
    }
  ];

  if (loading && !driver) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader size="large" text="Loading driver details..." />
      </div>
    );
  }

  return (
    <div className="driver-detail-page p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={handleBackClick}
        >
          Back to Drivers
        </Button>
        <h1 className="text-2xl font-semibold text-primary m-0">{driver?.name || 'Driver Details'}</h1>
      </div>

      <div className="tab-navigation flex border-b mb-6">
        <button 
          className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-primary-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'assignments' ? 'border-b-2 border-primary-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('assignments')}
        >
          Vehicle Assignments
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'documents' ? 'border-b-2 border-primary-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {activeTab === 'details' && driver && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Driver Information Card */}
          <Card>
            <CardHeader title="Driver Information" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Name</div>
                  <div className="font-medium">{driver.name}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div className="font-medium">{driver.email}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Phone</div>
                  <div className="font-medium">{driver.phone || '-'}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Role</div>
                  <div className="font-medium">
                    <span className="role-badge">
                      {driver.role}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Created At</div>
                  <div className="font-medium">{formatDate(driver.created_at)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Updated At</div>
                  <div className="font-medium">{formatDate(driver.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vehicle Information Card (if assigned) */}
          <Card>
            <CardHeader title="Current Vehicle Assignment" />
            <CardBody>
              {driver.assigned_vehicle ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Vehicle</div>
                    <div className="font-medium">{driver.assigned_vehicle}</div>
                  </div>
                  
                  {driver.vehicles && driver.vehicles.length > 0 && (
                    <>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Model</div>
                        <div className="font-medium">{driver.vehicles[0].model}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Year</div>
                        <div className="font-medium">{driver.vehicles[0].year}</div>
                      </div>
                    </>
                  )}
                  
                  <div className="col-span-2 mt-2">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => navigate(`${ROUTES.VEHICLES}/${driver.assigned_vehicle_id}`)}
                    >
                      View Vehicle Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">No vehicle currently assigned to this driver.</div>
              )}
            </CardBody>
          </Card>

          {/* Actions Card */}
          <Card className="lg:col-span-2">
            <CardHeader title="Actions" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {isAdmin() && (
                  <Button 
                    variant="primary" 
                    onClick={handleEditInUserManagement}
                  >
                    Edit in User Management
                  </Button>
                )}
                
                {isAdmin() && (
                  <Button 
                    variant="success" 
                    onClick={handleAssignVehicle}
                  >
                    Assign Vehicle
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={handleManageDocuments}
                >
                  Manage Documents
                </Button>
                
                <div className="col-span-full mt-2 text-sm text-gray-500">
                  <p>Note: To edit driver details or reset passwords, please use the User Management section.</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'assignments' && (
        <Card>
          <CardHeader title="Vehicle Assignment History" />
          <CardBody>
            {loadingAssignments ? (
              <div className="flex justify-center py-8">
                <Loader size="medium" text="Loading assignments..." />
              </div>
            ) : (
              <DataTable
                data={assignments}
                columns={assignmentColumns}
                pagination={true}
                pageSize={10}
                emptyMessage="No assignment history found"
                sortable={true}
                defaultSortField="start_date"
                defaultSortDirection="desc"
              />
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader 
            title="Driver Documents" 
            action={
              <Button
                variant="primary"
                size="small"
                onClick={handleManageDocuments}
              >
                Manage Documents
              </Button>
            }
          />
          <CardBody>
            {loadingDocuments ? (
              <div className="flex justify-center py-8">
                <Loader size="medium" text="Loading documents..." />
              </div>
            ) : (
              <DataTable
                data={documents}
                columns={documentColumns}
                pagination={true}
                pageSize={10}
                emptyMessage="No documents found"
                sortable={true}
                defaultSortField="expiry_date"
              />
            )}
          </CardBody>
        </Card>
      )}

      <style jsx>{`
        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
          background-color: rgba(0, 77, 153, 0.1);
          color: var(--primary-color);
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .status-badge.active {
          background-color: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }
        
        .status-badge.completed {
          background-color: rgba(108, 117, 125, 0.1);
          color: #6c757d;
        }
        
        .status-badge.cancelled {
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
        
        .status-badge.valid {
          background-color: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }
        
        .status-badge.expiring_soon {
          background-color: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        }
        
        .status-badge.expired {
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default DriverDetailPage;