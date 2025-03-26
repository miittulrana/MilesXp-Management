import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './DataTable.css';

/**
 * DataTable component for displaying tabular data with sorting and pagination
 * @param {Object} props - Component props
 * @returns {JSX.Element} DataTable component
 */
const DataTable = ({
  data = [],
  columns = [],
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  rowKey = 'id',
  emptyMessage = 'No data available',
  className = '',
  loading = false,
  sortable = true,
  defaultSortField,
  defaultSortDirection = 'asc',
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchFields = [],
  containerClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  rowClassName = '',
  cellClassName = '',
  ...rest
}) => {
  // State for current page
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for current page size
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  
  // Sort state
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  
  // Search state
  const [searchValue, setSearchValue] = useState('');
  
  // Selected rows state for internal use
  const [internalSelectedRows, setInternalSelectedRows] = useState(selectedRows || []);

  // Update internal selection state when external prop changes
  useEffect(() => {
    setInternalSelectedRows(selectedRows);
  }, [selectedRows]);

  // Filter data based on search value
  const filteredData = useMemo(() => {
    if (!searchValue.trim() || !searchable || searchFields.length === 0) {
      return data;
    }

    const searchTermLower = searchValue.toLowerCase();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const fieldValue = item[field];
        if (fieldValue === null || fieldValue === undefined) return false;
        
        return String(fieldValue).toLowerCase().includes(searchTermLower);
      });
    });
  }, [data, searchValue, searchable, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      // Handle null and undefined values
      if (aVal === null || aVal === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bVal === null || bVal === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      // Handle different types of values
      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal)
        : aVal - bVal;
        
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection, sortable]);

  // Calculate pagination values
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / currentPageSize);
  const startIndex = (currentPage - 1) * currentPageSize;
  const endIndex = Math.min(startIndex + currentPageSize, totalItems);
  
  // Get current page data
  const currentData = pagination
    ? sortedData.slice(startIndex, endIndex)
    : sortedData;

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setCurrentPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (!sortable) return;
    
    if (field === sortField) {
      // Toggle direction if clicking on the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to ascending by default
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle row selection
  const handleRowSelection = (rowId) => {
    if (!selectable || !onSelectionChange) return;
    
    let newSelectedRows;
    
    if (internalSelectedRows.includes(rowId)) {
      // Deselect the row
      newSelectedRows = internalSelectedRows.filter(id => id !== rowId);
    } else {
      // Select the row
      newSelectedRows = [...internalSelectedRows, rowId];
    }
    
    setInternalSelectedRows(newSelectedRows);
    onSelectionChange(newSelectedRows);
  };

  // Handle "select all" checkbox
  const handleSelectAll = () => {
    if (!selectable || !onSelectionChange) return;
    
    let newSelectedRows;
    
    if (internalSelectedRows.length === currentData.length) {
      // Deselect all rows
      newSelectedRows = [];
    } else {
      // Select all visible rows
      newSelectedRows = currentData.map(row => row[rowKey]);
    }
    
    setInternalSelectedRows(newSelectedRows);
    onSelectionChange(newSelectedRows);
  };

  // Generate pagination buttons
  const paginationButtons = () => {
    const buttons = [];
    const maxButtonsToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
    
    // Adjust start page if we're showing less than maxButtonsToShow
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }
    
    // Previous button
    buttons.push(
      <button 
        key="prev"
        className="datatable-pagination-button"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        &laquo;
      </button>
    );
    
    // First page button if we're not starting at page 1
    if (startPage > 1) {
      buttons.push(
        <button 
          key="first"
          className={`datatable-pagination-button ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="datatable-pagination-ellipsis">...</span>
        );
      }
    }
    
    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i}
          className={`datatable-pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    // Last page button if we're not ending at the last page
    if (endPage < totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="datatable-pagination-ellipsis">...</span>
        );
      }
      
      buttons.push(
        <button 
          key="last"
          className={`datatable-pagination-button ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }
    
    // Next button
    buttons.push(
      <button 
        key="next"
        className="datatable-pagination-button"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        &raquo;
      </button>
    );
    
    return buttons;
  };

  // Table classes
  const tableClasses = [
    'datatable',
    loading ? 'datatable-loading' : '',
    className
  ].filter(Boolean).join(' ');

  // Check if all rows on the current page are selected
  const allRowsSelected = currentData.length > 0 && 
    currentData.every(row => internalSelectedRows.includes(row[rowKey]));

  return (
    <div className={`datatable-container ${containerClassName}`} {...rest}>
      {/* Top control bar */}
      {(searchable || pagination) && (
        <div className="datatable-controls">
          {searchable && (
            <div className="datatable-search">
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="datatable-search-input"
              />
            </div>
          )}
          
          {pagination && (
            <div className="datatable-page-size">
              <label>
                Show
                <select
                  value={currentPageSize}
                  onChange={handlePageSizeChange}
                  className="datatable-page-size-select"
                >
                  {pageSizeOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                entries
              </label>
            </div>
          )}
        </div>
      )}
      
      {/* Table */}
      <div className="datatable-wrapper">
        <table className={tableClasses}>
          <thead className={headerClassName}>
            <tr>
              {selectable && (
                <th className="datatable-selection-cell">
                  <input
                    type="checkbox"
                    checked={allRowsSelected && currentData.length > 0}
                    onChange={handleSelectAll}
                    disabled={currentData.length === 0}
                  />
                </th>
              )}
              
              {columns.map(column => (
                <th
                  key={column.field}
                  className={`${column.headerClassName || ''} ${sortable && column.sortable !== false ? 'datatable-sortable-header' : ''}`}
                  onClick={() => column.sortable !== false && handleSortChange(column.field)}
                  style={column.width ? { width: column.width } : {}}
                >
                  <div className="datatable-header-content">
                    {column.title}
                    
                    {sortable && column.sortable !== false && sortField === column.field && (
                      <span className={`datatable-sort-icon datatable-sort-${sortDirection}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className={bodyClassName}>
            {loading ? (
              <tr className="datatable-loading-row">
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="datatable-loading-cell">
                  <div className="datatable-loader">Loading...</div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr className="datatable-empty-row">
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="datatable-empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map(row => {
                const rowId = row[rowKey];
                const isSelected = internalSelectedRows.includes(rowId);
                
                return (
                  <tr
                    key={rowId}
                    className={`${rowClassName} ${isSelected ? 'datatable-row-selected' : ''} ${onRowClick ? 'datatable-clickable-row' : ''}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="datatable-selection-cell" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelection(rowId)}
                        />
                      </td>
                    )}
                    
                    {columns.map(column => {
                      const cellValue = row[column.field];
                      const formattedValue = column.render 
                        ? column.render(cellValue, row)
                        : cellValue;
                        
                      return (
                        <td
                          key={`${rowId}-${column.field}`}
                          className={`${cellClassName} ${column.cellClassName || ''}`}
                        >
                          {formattedValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && totalItems > 0 && (
        <div className={`datatable-pagination ${footerClassName}`}>
          <div className="datatable-pagination-info">
            Showing {startIndex + 1} to {endIndex} of {totalItems} entries
          </div>
          
          <div className="datatable-pagination-buttons">
            {paginationButtons()}
          </div>
        </div>
      )}
    </div>
  );
};

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      title: PropTypes.node.isRequired,
      render: PropTypes.func,
      sortable: PropTypes.bool,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      headerClassName: PropTypes.string,
      cellClassName: PropTypes.string
    })
  ).isRequired,
  pagination: PropTypes.bool,
  pageSize: PropTypes.number,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  onRowClick: PropTypes.func,
  rowKey: PropTypes.string,
  emptyMessage: PropTypes.node,
  className: PropTypes.string,
  loading: PropTypes.bool,
  sortable: PropTypes.bool,
  defaultSortField: PropTypes.string,
  defaultSortDirection: PropTypes.oneOf(['asc', 'desc']),
  selectable: PropTypes.bool,
  selectedRows: PropTypes.array,
  onSelectionChange: PropTypes.func,
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  searchFields: PropTypes.arrayOf(PropTypes.string),
  containerClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  rowClassName: PropTypes.string,
  cellClassName: PropTypes.string
};

export default DataTable;