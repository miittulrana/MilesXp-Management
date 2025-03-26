import React, { useState, useEffect } from 'react';
import CalendarView from '../components/CalendarView';
import calendarService from '../services/calendarService';
import { useToast } from '../../../hooks/useToast';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import { formatDate } from '../../../lib/utils';

/**
 * Calendar Page component
 * @returns {JSX.Element} Calendar page component
 */
const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetailsLoading, setEventDetailsLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showError } = useToast();
  
  // Load calendar events for the given month
  const loadCalendarEvents = async (startDate, endDate) => {
    setLoading(true);
    
    try {
      const result = await calendarService.getCalendarEvents(startDate, endDate);
      
      if (result.error) {
        showError('Error loading calendar events');
        console.error('Error loading calendar events:', result.error);
      } else {
        setEvents(result.data || []);
      }
    } catch (error) {
      showError('Error loading calendar events');
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle month change in calendar
  const handleMonthChange = (monthStart, monthEnd) => {
    loadCalendarEvents(monthStart, monthEnd);
  };
  
  // Load event details when an event is clicked
  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setEventDetails(null);
    setIsModalOpen(true);
    setEventDetailsLoading(true);
    
    try {
      const result = await calendarService.getEventDetails(event.id, event.eventType);
      
      if (result.error) {
        showError('Error loading event details');
        console.error('Error loading event details:', result.error);
      } else {
        setEventDetails(result.data);
      }
    } catch (error) {
      showError('Error loading event details');
      console.error('Error loading event details:', error);
    } finally {
      setEventDetailsLoading(false);
    }
  };
  
  // Close event details modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      
      <CalendarView
        events={events}
        loading={loading}
        onMonthChange={handleMonthChange}
        onEventClick={handleEventClick}
      />
      
      {/* Event details modal */}
      {selectedEvent && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={`${selectedEvent.eventType === 'assignment' ? 'Assignment' : 'Block'} Details`}
        >
          {eventDetailsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader size="medium" text="Loading details..." />
            </div>
          ) : eventDetails ? (
            <div className="event-details">
              {selectedEvent.eventType === 'assignment' ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Vehicle Assignment</h3>
                    <p>
                      <span className="font-medium">Vehicle:</span> {eventDetails.vehicles.plate_number} ({eventDetails.vehicles.model} {eventDetails.vehicles.year})
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Driver Details</h3>
                    <p><span className="font-medium">Name:</span> {eventDetails.users.name}</p>
                    <p><span className="font-medium">Email:</span> {eventDetails.users.email}</p>
                    {eventDetails.users.phone && (
                      <p><span className="font-medium">Phone:</span> {eventDetails.users.phone}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Vehicle Block</h3>
                  <p>
                    <span className="font-medium">Vehicle:</span> {eventDetails.vehicles.plate_number} ({eventDetails.vehicles.model} {eventDetails.vehicles.year})
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Schedule</h3>
                <p>
                  <span className="font-medium">Start:</span> {formatDate(eventDetails.start_date, 'YYYY-MM-DD HH:mm')}
                </p>
                <p>
                  <span className="font-medium">End:</span> {formatDate(eventDetails.end_date, 'YYYY-MM-DD HH:mm')}
                </p>
              </div>
              
              {eventDetails.reason && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Reason</h3>
                  <p className="whitespace-pre-line">{eventDetails.reason}</p>
                </div>
              )}
              
              <div className="text-sm text-gray-500 border-t pt-4 mt-4">
                <p>Created by {selectedEvent.eventType === 'assignment' ? eventDetails.users.name : eventDetails.users.name} on {formatDate(eventDetails.created_at, 'YYYY-MM-DD HH:mm')}</p>
                <p>Status: <span className="font-semibold capitalize">{eventDetails.status}</span></p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No details available
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default CalendarPage;