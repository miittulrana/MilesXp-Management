// src/features/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import { ROUTES } from '../../lib/constants';
import Loader from '../../components/common/Loader/Loader';
import supabase from '../../lib/supabase';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    assignedVehicles: 0,
    blockedVehicles: 0,
    maintenanceVehicles: 0,
    totalDrivers: 0,
    expiringDocuments: [],
    serviceDue: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicle stats
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, status');
        
        if (vehiclesError) {
          console.error('Error fetching vehicles:', vehiclesError);
          throw new Error('Failed to fetch vehicle information');
        }
        
        // Fetch drivers
        const { data: drivers, error: driversError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'driver');
        
        if (driversError) {
          console.error('Error fetching drivers:', driversError);
          throw new Error('Failed to fetch driver information');
        }
        
        // Fetch expiring documents (within next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        let documents = [];
        try {
          const { data: docsData, error: documentsError } = await supabase
            .from('documents')
            .select('id, name, entity_type, entity_id, expiry_date')
            .lt('expiry_date', thirtyDaysFromNow.toISOString())
            .gt('expiry_date', new Date().toISOString())
            .order('expiry_date');
            
          if (!documentsError) {
            documents = docsData || [];
          } else {
            console.error('Error fetching documents:', documentsError);
          }
        } catch (docErr) {
          console.error('Exception fetching documents:', docErr);
        }
        
        // Fetch service records due - handle separately to prevent dashboard failure
        let serviceRecords = [];
        try {
          const { data: serviceData, error: serviceError } = await supabase
            .from('service_records')
            .select(`
              id, 
              vehicle_id,
              current_km,
              next_service_km,
              vehicles(plate_number, model)
            `)
            .order('next_service_km');
            
          if (!serviceError && serviceData) {
            // Filter records where service is due soon
            serviceRecords = serviceData.filter(record => {
              const kmRemaining = record.next_service_km - record.current_km;
              return kmRemaining <= 200; 
            });
          }
        } catch (serviceErr) {
          console.error('Error fetching service records:', serviceErr);
          // Continue with empty service records rather than failing the dashboard
        }
        
        // Calculate vehicle stats
        const vehicleStats = {
          totalVehicles: vehicles.length,
          availableVehicles: vehicles.filter(v => v.status === 'available').length,
          assignedVehicles: vehicles.filter(v => v.status === 'assigned').length,
          blockedVehicles: vehicles.filter(v => v.status === 'blocked').length,
          maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length
        };
        
        // Update state with all stats
        setStats({
          ...vehicleStats,
          totalDrivers: drivers.length,
          expiringDocuments: documents,
          serviceDue: serviceRecords
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError("Failed to load dashboard data.");
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString || 'Unknown';
    }
  };

  // Calculate days until expiration
  const getDaysUntil = (dateString) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(dateString);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  if (error) {
    return (
      <div className="dashboard-page p-6">
        <div className="error-message bg-red-50 p-6 rounded-lg border border-red-200 text-center">
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
      
      {loading ? (
        <div className="dashboard-loading flex justify-center items-center min-h-[400px]">
          <Loader size="large" text="Loading dashboard..." />
        </div>
      ) : (
        <>
          {/* Vehicle Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-primary">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Vehicles</h3>
                    <div className="text-3xl font-bold text-primary mt-2">{stats.totalVehicles}</div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                  <div className="text-green-600 bg-green-50 px-2 py-1 rounded">
                    <span className="font-medium">{stats.availableVehicles}</span> Available
                  </div>
                  <div className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <span className="font-medium">{stats.assignedVehicles}</span> Assigned
                  </div>
                  <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <span className="font-medium">{stats.maintenanceVehicles}</span> Maintenance
                  </div>
                  <div className="text-red-600 bg-red-50 px-2 py-1 rounded">
                    <span className="font-medium">{stats.blockedVehicles}</span> Blocked
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Drivers</h3>
                    <div className="text-3xl font-bold text-green-600 mt-2">{stats.totalDrivers}</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to={ROUTES.DRIVERS} className="text-green-700 hover:text-green-900 font-medium flex items-center">
                    View All Drivers
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Expiring Documents</h3>
                    <div className="text-3xl font-bold text-amber-600 mt-2">{stats.expiringDocuments.length}</div>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to={ROUTES.DOCUMENTS} className="text-amber-700 hover:text-amber-900 font-medium flex items-center">
                    View All Documents
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Service Due</h3>
                    <div className="text-3xl font-bold text-purple-600 mt-2">{stats.serviceDue.length}</div>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to={ROUTES.SERVICE_DUES} className="text-purple-700 hover:text-purple-900 font-medium flex items-center">
                    View Service Records
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Expiring Documents Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Expiring Documents</h2>
                <Link to={ROUTES.DOCUMENTS} className="text-primary hover:text-primary-dark font-medium text-sm flex items-center">
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              {stats.expiringDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No documents expiring within the next 30 days.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="py-3 px-4 text-left">Document Name</th>
                        <th className="py-3 px-4 text-left">Type</th>
                        <th className="py-3 px-4 text-left">Expiry Date</th>
                        <th className="py-3 px-4 text-left">Expires In</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      {stats.expiringDocuments.slice(0, 5).map((doc) => (
                        <tr key={doc.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{doc.name}</td>
                          <td className="py-3 px-4 capitalize">{doc.entity_type}</td>
                          <td className="py-3 px-4">{formatDate(doc.expiry_date)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              getDaysUntil(doc.expiry_date) <= 7
                                ? 'bg-red-100 text-red-700'
                                : getDaysUntil(doc.expiry_date) <= 14
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {getDaysUntil(doc.expiry_date)} days
                            </span>
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
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Upcoming Service Due</h2>
                <Link to={ROUTES.SERVICE_DUES} className="text-primary hover:text-primary-dark font-medium text-sm flex items-center">
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              {stats.serviceDue.length === 0 ? (
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
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      {stats.serviceDue.slice(0, 5).map((service) => (
                        <tr key={service.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{service.vehicles ? `${service.vehicles.plate_number} (${service.vehicles.model})` : 'Unknown'}</td>
                          <td className="py-3 px-4">{service.current_km.toLocaleString()}</td>
                          <td className="py-3 px-4">{service.next_service_km.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              service.next_service_km - service.current_km <= 0
                                ? 'bg-red-100 text-red-700'
                                : service.next_service_km - service.current_km <= 100
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {(service.next_service_km - service.current_km).toLocaleString()} km
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardPage;