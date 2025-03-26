import React from 'react';
import PropTypes from 'prop-types';
import Card, { CardHeader, CardBody, CardFooter } from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import DataTable from '../../../components/common/DataTable/DataTable';
import Loader from '../../../components/common/Loader/Loader';

/**
 * Report View component for displaying generated reports
 * @param {Object} props - Component props
 * @returns {JSX.Element} Report view component
 */
const ReportView = ({ 
  data, 
  columns, 
  title, 
  reportType,
  loading, 
  onDownloadCSV, 
  onDownloadPDF 
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader title={title || 'Report Results'} />
      <CardBody>
        {loading ? (
          <div className="text-center py-4">
            <Loader size="medium" text="Loading report data..." />
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            pagination
            searchable
            searchFields={columns.map(col => col.field)}
            emptyMessage="No data available for this report"
          />
        )}
      </CardBody>
      <CardFooter>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onDownloadCSV(data, reportType)}
            disabled={loading || !data.length}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => onDownloadPDF(data, columns, title, reportType)}
            disabled={loading || !data.length}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Download PDF
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

ReportView.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    render: PropTypes.func,
    isDate: PropTypes.bool,
    isNumber: PropTypes.bool
  })).isRequired,
  title: PropTypes.string,
  reportType: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  onDownloadCSV: PropTypes.func.isRequired,
  onDownloadPDF: PropTypes.func.isRequired
};

export default ReportView;