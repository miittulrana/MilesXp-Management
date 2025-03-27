import supabase from '../../lib/supabase';
import { getDocumentStatus } from '../../lib/utils';

/**
 * Service for document operations
 */
const documentService = {
  /**
   * Get all documents
   * @returns {Promise<Array>} List of documents
   */
  getDocuments: async () => {
    try {
      console.log('Fetching documents...');
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          vehicle:entity_id(id, plate_number)
        `)
        .order('expiry_date');
      
      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      
      console.log('Documents fetched:', data?.length || 0);
      
      // Process documents to include status based on expiry date
      return data.map(doc => {
        // Calculate status based on expiry date
        const status = getDocumentStatus(doc.expiry_date);
        
        // Determine entity name based on entity type
        let entityName = '';
        if (doc.entity_type === 'vehicle' && doc.vehicle) {
          entityName = doc.vehicle.plate_number;
        } else if (doc.entity_type === 'driver') {
          // We'd need to join with users table to get driver name
          // For now, just use the entity_id
          entityName = `Driver ${doc.entity_id}`;
        }
        
        return {
          ...doc,
          entity_name: entityName,
          status
        };
      });
    } catch (error) {
      console.error('Exception in getDocuments:', error);
      throw error;
    }
  },
  
  /**
   * Get documents by entity (vehicle or driver)
   * @param {string} entityType - Entity type ('vehicle' or 'driver')
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} List of documents for the entity
   */
  getDocumentsByEntity: async (entityType, entityId) => {
    try {
      console.log(`Fetching documents for ${entityType} ${entityId}...`);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('expiry_date');
      
      if (error) {
        console.error(`Error fetching documents for ${entityType} ${entityId}:`, error);
        throw error;
      }
      
      console.log(`Documents fetched for ${entityType} ${entityId}:`, data?.length || 0);
      
      // Process documents to include status based on expiry date
      return data.map(doc => {
        // Calculate status based on expiry date
        const status = getDocumentStatus(doc.expiry_date);
        
        return {
          ...doc,
          status
        };
      });
    } catch (error) {
      console.error(`Exception in getDocumentsByEntity:`, error);
      throw error;
    }
  },
  
  /**
   * Add a new document
   * @param {Object} documentData - Document data
   * @param {File} file - Document file
   * @returns {Promise<Object>} Created document
   */
  addDocument: async (documentData, file) => {
    try {
      console.log('Adding new document:', documentData.name);
      
      // Upload file to storage
      const timestamp = new Date().getTime();
      const filePath = `${documentData.entity_type}/${documentData.entity_id}/${timestamp}_${file.name}`;
      
      // Determine the correct storage bucket
      const storageBucket = documentData.entity_type === 'vehicle' ? 'vehicle_document' : 'driver_document';
      
      console.log(`Uploading file to ${storageBucket}/${filePath}`);
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading document file:', uploadError);
        throw uploadError;
      }
      
      // Get the file URL
      const { data: urlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded document');
      }
      
      console.log('File uploaded successfully, public URL:', urlData.publicUrl);
      
      // Insert document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: documentData.name,
          type: documentData.type,
          entity_type: documentData.entity_type,
          entity_id: documentData.entity_id,
          file_path: urlData.publicUrl,
          issue_date: documentData.issue_date,
          expiry_date: documentData.expiry_date
        })
        .select();
      
      if (error) {
        console.error('Error creating document record:', error);
        
        // Try to clean up the uploaded file if document record creation fails
        try {
          await supabase.storage
            .from(storageBucket)
            .remove([filePath]);
        } catch (cleanupError) {
          console.warn('Failed to clean up uploaded file after document creation error:', cleanupError);
        }
        
        throw error;
      }
      
      console.log('Document record created:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Exception in addDocument:', error);
      throw error;
    }
  },
  
  /**
   * Get document download URL
   * @param {string} documentId - Document ID
   * @returns {Promise<string>} Document download URL
   */
  getDocumentDownloadUrl: async (documentId) => {
    try {
      console.log('Getting download URL for document ID:', documentId);
      
      // Get document details
      const { data, error } = await supabase
        .from('documents')
        .select('file_path, entity_type, entity_id')
        .eq('id', documentId)
        .single();
      
      if (error) {
        console.error('Error getting document details:', error);
        throw error;
      }
      
      if (!data?.file_path) {
        throw new Error('Document file path not found');
      }
      
      console.log('Document download URL:', data.file_path);
      return data.file_path;
    } catch (error) {
      console.error('Exception in getDocumentDownloadUrl:', error);
      throw error;
    }
  },
  
  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @returns {Promise<boolean>} Success flag
   */
  deleteDocument: async (documentId) => {
    try {
      console.log('Deleting document ID:', documentId);
      
      // First get the document details to know which storage bucket to use
      const { data: docData, error: fetchError } = await supabase
        .from('documents')
        .select('file_path, entity_type')
        .eq('id', documentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching document details for deletion:', fetchError);
        throw fetchError;
      }
      
      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) {
        console.error('Error deleting document record:', error);
        throw error;
      }
      
      // Try to delete the file from storage if we have file path info
      if (docData?.file_path) {
        try {
          // Extract the file path from the URL
          const url = new URL(docData.file_path);
          const pathParts = url.pathname.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const storageBucket = docData.entity_type === 'vehicle' ? 'vehicle_document' : 'driver_document';
          
          console.log(`Attempting to delete file from ${storageBucket}:`, fileName);
          
          const { error: storageError } = await supabase.storage
            .from(storageBucket)
            .remove([fileName]);
          
          if (storageError) {
            console.warn('Failed to delete document file from storage:', storageError);
          }
        } catch (storageException) {
          console.warn('Exception when trying to delete document file:', storageException);
        }
      }
      
      console.log('Document deleted successfully');
      return true;
    } catch (error) {
      console.error('Exception in deleteDocument:', error);
      throw error;
    }
  }
};

export default documentService;