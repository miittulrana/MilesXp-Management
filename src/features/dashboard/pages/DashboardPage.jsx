import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import supabase from '../../../lib/supabase';
import { ROUTES } from '../../../lib/constants';
import { useToast } from '../../../hooks/useToast';

/**
 * Dashboard Page component
 * @returns {JSX.Element} Dashboard page component
 */
const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    assignedVehicles: 0,
    blockedVehicles: 0,
    totalDrivers: 0,
    expiringDocuments: 0,
    serviceDue: 0
  });
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      
      try {
        // Get vehicle stats
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('status');
        
        if (vehiclesError) throw vehiclesError;
        
        // Get driver stats
        const { data: drivers, error: driversError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'driver');
        
        if (driversError) throw driversError;
        
        // Get expiring documents
        const { data: expiringDocs, error: docsError } = await supabase
          .from('documents')
          .select('id')
          .or('status.eq.expiring_soon,status.eq.expired');
        
        if (docsError) throw docsError;
        
        // Get service due
        const { data: serviceDue, error: serviceError } = await supabase
          .from('service_records')
          .select('id')
          .or('status.eq.due_soon,status.eq.overdue');
        
        if (serviceError) throw serviceError;
        
        // Count vehicles by status
        const availableCount = vehicles.filter(v => v.status === 'available').length;
        const assignedCount = vehicles.filter(v => v.status === 'assigned').length;
        const blockedCount = vehicles.filter(v => v.status === 'blocked' || v.status === 'maintenance').length;
        
        setStats({
          totalVehicles: vehicles.length,
          availableVehicles: availableCount,
          assignedVehicles: assignedCount,
          blockedVehicles: blockedCount,
          totalDrivers: drivers.length,
          expiringDocuments: expiringDocs.length,
          serviceDue: serviceDue.length
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showError('Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [showError]);

  // Quick actions
  const quickActions = [
    {
      title: 'Add Vehicle',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      ),
      route: ROUTES.VEHICLES,
      color: 'bg-primary-100 text-primary'
    },
    {
      title: 'Add Driver',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      route: ROUTES.DRIVERS,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Assign Vehicle',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      ),
      route: ROUTES.ASSIGN_VEHICLE,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Vehicle Tracking',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
      route: ROUTES.VEHICLE_TRACKING,
      color: 'bg-secondary-100 text-secondary'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-primary">
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Vehicles</p>
                <h3 className="text-2xl font-bold text-primary">{loading ? '...' : stats.totalVehicles}</h3>
              </div>
              <div className="bg-white p-2 rounded-full shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004d99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">{loading ? '...' : stats.availableVehicles} Available</span>
              <span className="text-gray-600 mx-2">•</span>
              <span className="text-blue-600 font-medium">{loading ? '...' : stats.assignedVehicles} Assigned</span>
              <span className="text-gray-600 mx-2">•</span>
              <span className="text-red-600 font-medium">{loading ? '...' : stats.blockedVehicles} Blocked</span>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Drivers</p>
                <h3 className="text-2xl font-bold text-green-600">{loading ? '...' : stats.totalDrivers}</h3>
              </div>
              <div className="bg-white p-2 rounded-full shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">Active Drivers</span>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Expiring Documents</p>
                <h3 className="text-2xl font-bold text-yellow-600">{loading ? '...' : stats.expiringDocuments}</h3>
              </div>
              <div className="bg-white p-2 rounded-full shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <Link to={ROUTES.DOCUMENT_STATUS} className="text-yellow-600 font-medium hover:underline">
                View Details →
              </Link>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Service Due</p>
                <h3 className="text-2xl font-bold text-red-600">{loading ? '...' : stats.serviceDue}</h3>
              </div>
              <div className="bg-white p-2 rounded-full shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <Link to={ROUTES.SERVICE_DUES} className="text-red-600 font-medium hover:underline">
                View Details →
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                to={action.route}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`p-3 rounded-full ${action.color} mb-3`}>
                  {action.icon}
                </div>
                <span className="text-center text-sm font-medium">{action.title}</span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
      
      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h2 className="text-lg font-semibold">Recent Assignments</h2>
              <Link to={ROUTES.VEHICLE_LOGS}>
                <Button variant="text" size="small">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 text-center text-gray-500">
                  No recent assignments
                </div>
              </div>
            )}
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h2 className="text-lg font-semibold">Upcoming Service</h2>
              <Link to={ROUTES.SERVICE_DUES}>
                <Button variant="text" size="small">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 text-center text-gray-500">
                  No upcoming service
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;