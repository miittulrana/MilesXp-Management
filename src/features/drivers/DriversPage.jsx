import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import driverService from './driverService';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/utils';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import DataTable from '../../components/common/DataTable/DataTable';

/**
 * Drivers Page component
 */
const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { showError } = useToast();
  const navigate = useNavigate();
  
  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);
  
  // Get all drivers
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await driverService.getDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      showError('Failed to load drivers. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle row click to navigate to driver details
  const handleRowClick = (driver) => {
    navigate(`${ROUTES.DRIVERS}/${driver.id}`);
  };
  
  // Navigate to user management if user wants to add a driver
  const handleAddDriverRedirect = () => {
    navigate(ROUTES.USERS);
  };
  
  // Table columns configuration
  const columns = [
    {
      field: 'name',
      title: 'Name',
      sortable: true
    },
    {
      field: 'email',
      title: 'Email',
      sortable: true
    },
    {
      field: 'phone',
      title: 'Phone',
      sortable: false,
      render: (value) => value || '—'
    },
    {
      field: 'assigned_vehicle',
      title: 'Assigned Vehicle',
      sortable: true,
      render: (value) => value || '—'
    },
    {
      field: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => formatDate(value)
    }
  ];
  
  return (
    <div className="drivers-page p-4">
      <div className="page-header flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-primary">Drivers</h1>
        <Button
          variant="primary"
          onClick={handleAddDriverRedirect}
        >
          Manage Users
        </Button>
      </div>
      
      <Card>
        <CardHeader title="Driver List" />
        <CardBody>
          {loading && drivers.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader size="large" text="Loading drivers..." />
            </div>
          ) : (
            <DataTable
              data={drivers}
              columns={columns}
              onRowClick={handleRowClick}
              pagination={true}
              pageSize={10}
              searchable={true}
              searchPlaceholder="Search drivers..."
              searchFields={['name', 'email', 'phone']}
              sortable={true}
              defaultSortField="name"
              loading={loading}
              emptyMessage="No drivers found"
              rowClassName="cursor-pointer"
            />
          )}
        </CardBody>
      </Card>
      
      <div className="mt-6 bg-surface-color p-4 rounded-lg border border-border-color">
        <h3 className="text-lg font-semibold mb-2">Need to add or update drivers?</h3>
        <p className="text-text-secondary mb-4">
          Driver accounts are managed in the User Management section. You can add new drivers, edit their information, 
          or reset passwords from there.
        </p>
        <Button
          variant="outline"
          onClick={handleAddDriverRedirect}
        >
          Go to User Management
        </Button>
      </div>
    </div>
  );
};

export default DriversPage;