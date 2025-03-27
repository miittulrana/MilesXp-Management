// src/features/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import { ROUTES } from '../../lib/constants';
import supabase from '../../lib/supabase';

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

  // Load dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      try {
        // Get vehicle stats
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('status');
        
        // Get driver stats
        const { data: drivers } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'driver');
        
        // Get expiring documents
        const { data: expiringDocs } = await supabase
          .from('documents')
          .select('id')
          .or('status.eq.expiring_soon,status.eq.expired');
        
        // Get service due
        const { data: serviceDue } = await supabase
          .from('service_records')
          .select('id')
          .or('status.eq.due_soon,status.eq.overdue');
        
        // Count vehicles by status
        const availableCount = vehicles.filter(v => v.status === 'available').length;
        const assignedCount = vehicles.filter(v => v.status === 'assigned').length;
        const blockedCount = vehicles.filter(v => v.status === 'blocked').length;
        
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const quickActions = [
    { title: 'Add Vehicle', route: ROUTES.VEHICLES },
    { title: 'Add Driver', route: ROUTES.DRIVERS },
    { title: 'Assign Vehicle', route: ROUTES.ASSIGN_VEHICLE },
    { title: 'Vehicle Tracking', route: ROUTES.VEHICLE_TRACKING }
  ];

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <Card>
          <CardBody>
            <h3>Total Vehicles</h3>
            <div className="stat-value">{loading ? '...' : stats.totalVehicles}</div>
            <div className="stat-detail">
              <span>{loading ? '...' : stats.availableVehicles} Available</span>
              <span>{loading ? '...' : stats.assignedVehicles} Assigned</span>
              <span>{loading ? '...' : stats.blockedVehicles} Blocked</span>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <h3>Total Drivers</h3>
            <div className="stat-value">{loading ? '...' : stats.totalDrivers}</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <h3>Expiring Documents</h3>
            <div className="stat-value">{loading ? '...' : stats.expiringDocuments}</div>
            <Link to={ROUTES.DOCUMENTS}>View Details →</Link>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <h3>Service Due</h3>
            <div className="stat-value">{loading ? '...' : stats.serviceDue}</div>
            <Link to={ROUTES.SERVICE_DUES}>View Details →</Link>
          </CardBody>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2>Quick Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.route} className="quick-action-button">
                {action.title}
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DashboardPage;