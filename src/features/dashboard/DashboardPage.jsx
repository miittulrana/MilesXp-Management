import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import { ROUTES, ROLES, DOCUMENT_STATUS, SERVICE_STATUS } from '../../lib/constants';
import vehicleService from '../../features/vehicles/vehicleService';
import driverService from '../../features/drivers/driverService';
import documentService from '../../features/documents/documentService';
import serviceService from '../../features/service/serviceService';
import { formatDate, getDaysRemaining } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

/**
 * Dashboard component showing overview of system data
 */
const DashboardPage = () => {
  const { isAdmin } = useAuth();
  
  // State variables for dashboard data
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    assignedVehicles: 0,
    blockedVehicles: 0,
    maintenanceVehicles: 0,
    totalDrivers: 0
  });
  
  // State for expiring documents
  const [docsLoading, setDocsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  
  // State for service records
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceRecords, setServiceRecords] = useState([]);

  // Load all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch all dashboard data in parallel
  const fetchDashboardData = async () => {
    try {
      // Start all data fetching in parallel
      const vehiclesPromise = fetchVehicleStats();
      const driversPromise = fetchDriverStats();
      const documentsPromise = fetchDocuments();
      const servicePromise = fetchServiceRecords();
      
      // Wait for all data to be fetched
      await Promise.all([vehiclesPromise, driversPromise, documentsPromise, servicePromise]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    }
  };

  // Fetch vehicle statistics
  const fetchVehicleStats = async () => {
    try {
      setStatsLoading(true);
      const vehiclesData = await vehicleService.getVehicles();
      
      // Count vehicles by status
      const counts = {
        total: vehiclesData.length,
        available: 0,
        assigned: 0,
        blocked: 0,
        maintenance: 0
      };
      
      // Count by status
      vehiclesData.forEach(vehicle => {
        const status = vehicle.status.toLowerCase();
        if (counts.hasOwnProperty(status)) {
          counts[status]++;
        }
      });
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        totalVehicles: counts.total,
        availableVehicles: counts.available,
        assignedVehicles: counts.assigned,
        blockedVehicles: counts.blocked,
        maintenanceVehicles: counts.maintenance
      }));
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      setError('Failed to load vehicle information');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch driver statistics (only users with driver role)
  const fetchDriverStats = async () => {
    try {
      const driversData = await driverService.getDrivers();
      
      // Update stats with driver count
      setStats(prevStats => ({
        ...prevStats,
        totalDrivers: driversData.length || 0
      }));
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  };

  // Fetch expiring documents
  const fetchDocuments = async () => {
    try {
      setDocsLoading(true);
      const allDocuments = await documentService.getDocuments();
      
      // Filter to only show documents with status expiring_soon or expired
      const expiringDocs = allDocuments.filter(doc => 
        doc.status === DOCUMENT_STATUS.EXPIRING_SOON || 
        doc.status === DOCUMENT_STATUS.EXPIRED
      );
      
      // Sort by expiry date (soonest first)
      const sortedDocs = expiringDocs.sort((a, b) => {
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      });
      
      setDocuments(sortedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocsLoading(false);
    }
  };

  // Fetch service records
  const fetchServiceRecords = async () => {
    try {
      setServiceLoading(true);
      const records = await serviceService.getServiceRecords();
      
      // Filter to only show records that are due_soon or overdue
      const dueRecords = records.filter(record => 
        record.status === SERVICE_STATUS.DUE_SOON || 
        record.status === SERVICE_STATUS.OVERDUE
      );
      
      // Sort by km remaining (least first)
      const sortedRecords = dueRecords.sort((a, b) => {
        return a.km_remaining - b.km_remaining;
      });
      
      setServiceRecords(sortedRecords);
    } catch (error) {
      console.error('Error fetching service records:', error);
    } finally {
      setServiceLoading(false);
    }
  };

  // Calculate days until expiration
  const getDaysUntil = (dateString) => {
    return getDaysRemaining(dateString);
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status) => {
    let className = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch(status.toLowerCase()) {
      case 'available':
        className += " bg-green-100 text-green-800";
        break;
      case 'assigned':
        className += " bg-blue-100 text-blue-800";
        break;
      case 'maintenance':
        className += " bg-yellow-100 text-yellow-800";
        break;
      case 'blocked':
        className += " bg-red-100 text-red-800";
        break;
      case 'expiring_soon':
        className += " bg-yellow-100 text-yellow-800";
        break;
      case 'expired':
        className += " bg-red-100 text-red-800";
        break;
      case 'due_soon':
        className += " bg-yellow-100 text-yellow-800";
        break;
      case 'overdue':
        className += " bg-red-100 text-red-800";
        break;
      default:
        className += " bg-gray-100 text-gray-800";
    }
    
    return (
      <span className={className}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (error) {
    return (
      <div className="dashboard-page p-6">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="primary"
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>
      
      {statsLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="large" text="Loading dashboard..." />
        </div>
      ) : (
        <>
          {/* Vehicle Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-blue-50 border-l-4 border-primary">
              <CardBody className="p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Total Vehicles</h3>
                  <div className="text-3xl font-bold text-primary mt-2">{stats.totalVehicles}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="text-green-600 bg-green-50 px-2 py-2 rounded text-center">
                    <div className="font-medium text-base">{stats.availableVehicles}</div>
                    <div>Available</div>
                  </div>
                  <div className="text-blue-600 bg-blue-50 px-2 py-2 rounded text-center">
                    <div className="font-medium text-base">{stats.assignedVehicles}</div>
                    <div>Assigned</div>
                  </div>
                  <div className="text-orange-600 bg-orange-50 px-2 py-2 rounded text-center">
                    <div className="font-medium text-base">{stats.maintenanceVehicles}</div>
                    <div>Maintenance</div>
                  </div>
                  <div className="text-red-600 bg-red-50 px-2 py-2 rounded text-center">
                    <div className="font-medium text-base">{stats.blockedVehicles}</div>
                    <div>Blocked</div>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-green-50 border-l-4 border-green-500">
              <CardBody className="p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Total Drivers</h3>
                  <div className="text-3xl font-bold text-green-600 mt-2">{stats.totalDrivers}</div>
                </div>
                <div className="mt-6 text-center">
                  <Link to={ROUTES.DRIVERS} className="text-green-700 hover:text-green-900 font-medium">
                    View All Drivers →
                  </Link>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-amber-50 border-l-4 border-amber-500">
              <CardBody className="p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Expiring Documents</h3>
                  <div className="text-3xl font-bold text-amber-600 mt-2">{documents.length}</div>
                </div>
                <div className="mt-6 text-center">
                  <Link to={ROUTES.DOCUMENTS} className="text-amber-700 hover:text-amber-900 font-medium">
                    View All Documents →
                  </Link>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-purple-50 border-l-4 border-purple-500">
              <CardBody className="p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Service Due</h3>
                  <div className="text-3xl font-bold text-purple-600 mt-2">{serviceRecords.length}</div>
                </div>
                <div className="mt-6 text-center">
                  <Link to={ROUTES.SERVICE_DUES} className="text-purple-700 hover:text-purple-900 font-medium">
                    View Service Records →
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Expiring Documents Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center w-full">
                <h2 className="text-xl font-semibold">Expiring Documents</h2>
                <span className="flex-grow"></span>
                <Link to={ROUTES.DOCUMENTS} className="text-primary hover:text-primary-dark font-medium text-sm">
                  View All →
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="medium" text="Loading documents..." />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No documents expiring soon.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="py-3 px-4 text-left">Document Name</th>
                        <th className="py-3 px-4 text-left">Type</th>
                        <th className="py-3 px-4 text-left">Entity</th>
                        <th className="py-3 px-4 text-left">Expiry Date</th>
                        <th className="py-3 px-4 text-left">Expires In</th>
                        <th className="py-3 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      {documents.slice(0, 5).map((doc) => (
                        <tr key={doc.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{doc.name}</td>
                          <td className="py-3 px-4">{doc.type}</td>
                          <td className="py-3 px-4 capitalize">{doc.entity_type}: {doc.entity_name}</td>
                          <td className="py-3 px-4">{formatDate(doc.expiry_date)}</td>
                          <td className="py-3 px-4">
                            {getDaysUntil(doc.expiry_date) < 0 
                              ? <span className="text-red-600 font-medium">Expired</span>
                              : `${getDaysUntil(doc.expiry_date)} days`
                            }
                          </td>
                          <td className="py-3 px-4">
                            {renderStatusBadge(doc.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
          
          {/* Service Due Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center w-full">
                <h2 className="text-xl font-semibold">Upcoming Service Due</h2>
                <span className="flex-grow"></span>
                <Link to={ROUTES.SERVICE_DUES} className="text-primary hover:text-primary-dark font-medium text-sm">
                  View All →
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              {serviceLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="medium" text="Loading service records..." />
                </div>
              ) : serviceRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No vehicles due for service soon.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="py-3 px-4 text-left">Vehicle</th>
                        <th className="py-3 px-4 text-left">Current KM</th>
                        <th className="py-3 px-4 text-left">Next Service KM</th>
                        <th className="py-3 px-4 text-left">KM Remaining</th>
                        <th className="py-3 px-4 text-left">Service Date</th>
                        <th className="py-3 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      {serviceRecords.slice(0, 5).map((service) => (
                        <tr key={service.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{service.vehicle_plate}</td>
                          <td className="py-3 px-4">{service.current_km.toLocaleString()}</td>
                          <td className="py-3 px-4">{service.next_service_km.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${service.km_remaining <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                              {service.km_remaining.toLocaleString()} km
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatDate(service.service_date)}</td>
                          <td className="py-3 px-4">
                            {renderStatusBadge(service.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
          
          {/* Removed admin actions section as requested */}
        </>
      )}
    </div>
  );
};

export default DashboardPage;