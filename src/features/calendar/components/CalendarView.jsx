import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { addMonths, subMonths, format } from 'date-fns';
import Card, { CardHeader, CardBody } from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import { formatDate } from '../../../lib/utils';

/**
 * Calendar View component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Calendar view component
 */
const CalendarView = ({
  events,
  loading,
  onMonthChange,
  onEventClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [days, setDays] = useState([]);
  const [monthStart, setMonthStart] = useState(null);
  const [monthEnd, setMonthEnd] = useState(null);
  
  // Generate days for the month view
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Get first day of the week
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Get last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    // Get last day of the calendar (make sure we have 6 weeks)
    const endDate = new Date(lastDayOfMonth);
    const daysToAdd = 6 - endDate.getDay();
    endDate.setDate(endDate.getDate() + daysToAdd);
    
    // Store month start and end for events fetching
    setMonthStart(firstDayOfMonth);
    setMonthEnd(lastDayOfMonth);
    
    // Generate 42 days (6 weeks)
    const calendarDays = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      calendarDays.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    setDays(calendarDays);
    
    // Notify parent of month change
    if (onMonthChange) {
      onMonthChange(firstDayOfMonth, lastDayOfMonth);
    }
  }, [currentDate, onMonthChange]);
  
  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Navigate to current month
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    
    if (onEventClick) {
      onEventClick(event);
    }
  };
  
  // Close event detail modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Check if a day is in the current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };
  
  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Get events for a specific day
  const getEventsForDay = (date) => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };
  
  return (
    <div className="calendar-container">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="small" onClick={handlePrevMonth}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </Button>
              <Button variant="outline" size="small" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="small" onClick={handleNextMonth}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader size="large" text="Loading calendar events..." />
            </div>
          ) : (
            <div className="calendar-grid">
              {/* Days of week header */}
              <div className="calendar-days-header">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-day-name">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="calendar-days-grid">
                {days.map(day => {
                  const dayEvents = getEventsForDay(day);
                  
                  return (
                    <div 
                      key={day.toString()} 
                      className={`calendar-day ${isCurrentMonth(day) ? 'current-month' : 'other-month'} ${isToday(day) ? 'today' : ''}`}
                    >
                      <div className="calendar-day-number">
                        {day.getDate()}
                      </div>
                      
                      <div className="calendar-events">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="calendar-event"
                            style={{ backgroundColor: event.color }}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="calendar-event-time">
                              {format(new Date(event.start), 'HH:mm')}
                            </div>
                            <div className="calendar-event-title">
                              {event.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Event detail modal */}
      {selectedEvent && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={`Event Details: ${selectedEvent.title}`}
        >
          <div className="event-details">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {selectedEvent.eventType === 'assignment' ? 'Assignment' : 'Vehicle Block'}
              </h3>
              <p>
                <strong>Vehicle:</strong> {selectedEvent.vehiclePlate}
              </p>
              {selectedEvent.driverName && (
                <p>
                  <strong>Driver:</strong> {selectedEvent.driverName}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <p>
                <strong>Start:</strong> {formatDate(selectedEvent.start, 'YYYY-MM-DD HH:mm')}
              </p>
              <p>
                <strong>End:</strong> {formatDate(selectedEvent.end, 'YYYY-MM-DD HH:mm')}
              </p>
            </div>
            
            {selectedEvent.reason && (
              <div className="mb-4">
                <p><strong>Reason:</strong></p>
                <p className="text-sm">{selectedEvent.reason}</p>
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              Created by: {selectedEvent.createdBy}
            </p>
          </div>
        </Modal>
      )}
      
      <style jsx>{`
        .calendar-grid {
          display: flex;
          flex-direction: column;
        }
        
        .calendar-days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background-color: var(--surface-color);
          border-bottom: 1px solid var(--border-color);
        }
        
        .calendar-day-name {
          padding: 0.5rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: minmax(100px, auto);
          border-left: 1px solid var(--border-color);
        }
        
        .calendar-day {
          padding: 0.5rem;
          border-right: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          min-height: 100px;
          position: relative;
        }
        
        .other-month {
          background-color: rgba(0, 0, 0, 0.02);
          color: var(--text-tertiary);
        }
        
        .today {
          background-color: rgba(0, 77, 153, 0.05);
        }
        
        .calendar-day-number {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .today .calendar-day-number {
          background-color: var(--primary-color);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .calendar-events {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .calendar-event {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          cursor: pointer;
          color: white;
          transition: opacity 0.2s ease;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .calendar-event:hover {
          opacity: 0.9;
        }
        
        .calendar-event-time {
          font-weight: 500;
          margin-bottom: 0.125rem;
        }
        
        .calendar-event-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .event-details {
          font-size: 0.875rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

CalendarView.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      start: PropTypes.instanceOf(Date).isRequired,
      end: PropTypes.instanceOf(Date).isRequired,
      vehicleId: PropTypes.string.isRequired,
      vehiclePlate: PropTypes.string.isRequired,
      driverId: PropTypes.string,
      driverName: PropTypes.string,
      eventType: PropTypes.string.isRequired,
      reason: PropTypes.string,
      createdBy: PropTypes.string.isRequired,
      color: PropTypes.string,
      textColor: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  onMonthChange: PropTypes.func,
  onEventClick: PropTypes.func
};

export default CalendarView;