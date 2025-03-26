/**
 * Custom vehicle marker class for Mapbox
 */
class VehicleMarker {
    /**
     * Constructor for vehicle marker
     * @param {HTMLElement} element - DOM element for the marker
     * @param {Object} vehicle - Vehicle data
     * @param {boolean} selected - Whether the marker is selected
     * @param {Function} onClick - Click callback function
     */
    constructor(element, vehicle, selected = false, onClick = null) {
      this.element = element;
      this.vehicle = vehicle;
      this.selected = selected;
      this.onClick = onClick;
      
      // Initialize marker
      this.render();
    }
    
    /**
     * Render the marker
     */
    render() {
      // Clear existing content
      this.element.innerHTML = '';
      
      // Create container
      const container = document.createElement('div');
      container.className = `vehicle-marker ${this.selected ? 'vehicle-marker-selected' : ''}`;
      
      // Create vehicle icon with rotation based on heading
      const icon = document.createElement('div');
      icon.className = 'vehicle-marker-icon';
      
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('width', '32');
      iconSvg.setAttribute('height', '32');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', this.selected ? '#ff7700' : '#004d99');
      iconSvg.setAttribute('stroke-width', '2');
      
      // Car icon path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M7 17h10v-6H7v6zm3-9h4l2 3H8l2-3zm-6 9v-6l2-6h10l2 6v6h-2v3h-4v-3h-2v3H6v-3H4z');
      path.setAttribute('fill', this.selected ? '#ff7700' : '#004d99');
      path.setAttribute('stroke', 'none');
      
      // Add direction indicator
      const directionIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      directionIndicator.setAttribute('d', 'M12 5l4 4-4-4-4 4');
      directionIndicator.setAttribute('fill', 'none');
      directionIndicator.setAttribute('stroke', '#ffffff');
      directionIndicator.setAttribute('stroke-width', '2');
      directionIndicator.setAttribute('stroke-linecap', 'round');
      directionIndicator.setAttribute('stroke-linejoin', 'round');
      
      iconSvg.appendChild(path);
      iconSvg.appendChild(directionIndicator);
      icon.appendChild(iconSvg);
      
      // Apply rotation if heading is available
      if (this.vehicle.position?.heading) {
        icon.style.transform = `rotate(${this.vehicle.position.heading}deg)`;
      }
      
      // Create label
      const label = document.createElement('div');
      label.className = 'vehicle-marker-label';
      
      const plateNumber = document.createElement('div');
      plateNumber.className = 'vehicle-marker-plate';
      plateNumber.textContent = this.vehicle.plate_number;
      
      const driverName = document.createElement('div');
      driverName.className = 'vehicle-marker-driver';
      driverName.textContent = this.vehicle.users?.name || 'Unassigned';
      
      label.appendChild(plateNumber);
      label.appendChild(driverName);
      
      // Add speed indicator if available
      if (this.vehicle.position?.speed) {
        const speed = document.createElement('div');
        speed.className = 'vehicle-marker-speed';
        speed.textContent = `${Math.round(this.vehicle.position.speed)} km/h`;
        label.appendChild(speed);
      }
      
      // Add elements to container
      container.appendChild(icon);
      container.appendChild(label);
      this.element.appendChild(container);
      
      // Add click event
      if (this.onClick) {
        this.element.onclick = (e) => {
          e.stopPropagation();
          this.onClick(this.vehicle);
        };
      }
      
      // Add CSS for the marker
      const style = document.createElement('style');
      style.textContent = `
        .vehicle-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }
        
        .vehicle-marker-icon {
          width: 32px;
          height: 32px;
          transition: transform 0.3s ease;
        }
        
        .vehicle-marker-label {
          background-color: white;
          border-radius: 4px;
          padding: 4px 8px;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 600;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #ddd;
          white-space: nowrap;
          min-width: 80px;
          transition: all 0.3s ease;
        }
        
        .vehicle-marker-plate {
          color: #004d99;
          font-weight: 700;
        }
        
        .vehicle-marker-driver {
          color: #555;
          font-size: 9px;
          margin-top: 2px;
        }
        
        .vehicle-marker-speed {
          font-size: 9px;
          color: #ff7700;
          margin-top: 2px;
        }
        
        .vehicle-marker-selected .vehicle-marker-label {
          background-color: #004d99;
          border-color: #004d99;
        }
        
        .vehicle-marker-selected .vehicle-marker-plate {
          color: white;
        }
        
        .vehicle-marker-selected .vehicle-marker-driver {
          color: #f0f0f0;
        }
        
        .vehicle-marker-selected .vehicle-marker-speed {
          color: #ff9a44;
        }
      `;
      document.head.appendChild(style);
    }
    
    /**
     * Update the marker with new data
     * @param {Object} vehicle - Updated vehicle data
     * @param {boolean} selected - Whether the marker is selected
     * @param {number} heading - Vehicle heading (direction)
     */
    update(vehicle, selected = false, heading = null) {
      this.vehicle = vehicle;
      this.selected = selected;
      
      // Check if position or heading has changed
      const headingChanged = heading !== null && heading !== this.vehicle.position?.heading;
      
      // Update vehicle data
      this.vehicle = vehicle;
      
      // Re-render if selection state changed
      if (this.selected !== selected || headingChanged) {
        this.selected = selected;
        this.render();
      } else {
        // Just update content without full re-render
        const plateElement = this.element.querySelector('.vehicle-marker-plate');
        const driverElement = this.element.querySelector('.vehicle-marker-driver');
        const speedElement = this.element.querySelector('.vehicle-marker-speed');
        
        if (plateElement) {
          plateElement.textContent = this.vehicle.plate_number;
        }
        
        if (driverElement) {
          driverElement.textContent = this.vehicle.users?.name || 'Unassigned';
        }
        
        if (speedElement && this.vehicle.position?.speed) {
          speedElement.textContent = `${Math.round(this.vehicle.position.speed)} km/h`;
        }
      }
    }
    
    /**
     * Set the selected state of the marker
     * @param {boolean} selected - Whether the marker is selected
     */
    setSelected(selected) {
      if (this.selected !== selected) {
        this.selected = selected;
        this.render();
      }
    }
  }
  
  export default VehicleMarker;