import supabase from '../../../lib/supabase';
import { ENTITY_TYPES } from '../../../lib/constants';

/**
 * Service for document-related operations
 */
const DocumentService = {
  /**
   * Get all documents
   * @returns {Promise<Array>} Array of documents
   */
  getDocuments: async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          vehicle:documents(id, plate_number)
          driver:documents(id, name)
        `)
        .order('expiry_date');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },
  
  /**
   * Get document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Document details
   */
  getDocumentById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          vehicle:documents(id, plate_number)
          driver:documents(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get documents by entity (vehicle or driver)
   * @param {string} entityType - Entity type (vehicle, driver)
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} Array of documents
   */
  getDocumentsByEntity: async (entityType, entityId) => {
    try {
      if (!Object.values(ENTITY_TYPES).includes(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('expiry_date');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching documents for ${entityType} ${entityId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get expiring documents
   * @param {number} daysThreshold - Days threshold for expiry
   * @returns {Promise<Array>} Array of expiring documents
   */
  getExpiringDocuments: async (daysThreshold = 30) => {
    try {
      // Try using the optimized function
      const { data: expiringData, error: functionError } = await supabase
        .rpc('get_expiring_documents', { days_threshold: daysThreshold });
      
      if (!functionError && expiringData) {
        return expiringData;
      }
      
      // Fall back to regular query
      const today = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(today.getDate() + daysThreshold);
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          vehicle:documents(id, plate_number)
          driver:documents(id, name, email)
        `)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', expiryDate.toISOString().split('T')[0])
        .order('expiry_date');
      
      if (error) throw error;
      
      // Format data to include entity information
      return data.map(doc => ({
        ...doc,
        entity_name: doc.entity_type === ENTITY_TYPES.VEHICLE 
          ? doc.vehicle?.plate_number 
          : doc.driver?.name,
        email: doc.entity_type === ENTITY_TYPES.DRIVER
          ? doc.driver?.email
          : null,
        days_remaining: Math.ceil((new Date(doc.expiry_date) - today) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
      throw error;
    }
  },
  
  /**
   * Add a new document
   * @param {Object} documentData - Document data
   * @param {File} file - Document file
   * @returns {Promise<Object>} Added document
   */
  addDocument: async (documentData, file) => {
    try {
      // Upload file to storage
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const filePath = `${documentData.entity_type}/${documentData.entity_id}/${timestamp}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // Try using the add_document function
      const isAdmin = true; // This would be determined by your auth logic
      if (isAdmin) {
        const { data: docData, error: docError } = await supabase
          .rpc('add_document', {
            doc_name: documentData.name,
            doc_type: documentData.type,
            entity_type_val: documentData.entity_type,
            entity_id_val: documentData.entity_id,
            file_path_val: publicUrl,
            issue_date_val: documentData.issue_date,
            expiry_date_val: documentData.expiry_date,
            admin_id: null // This would be the current user's ID
          });
        
        if (!docError && docData) {
          return { id: docData };
        }
      }
      
      // Fall back to regular insert
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: documentData.name,
          type: documentData.type,
          entity_type: documentData.entity_type,
          entity_id: documentData.entity_id,
          file_path: publicUrl,
          issue_date: documentData.issue_date,
          expiry_date: documentData.expiry_date
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing document
   * @param {string} id - Document ID
   * @param {Object} documentData - Updated document data
   * @param {File} file - Document file (optional)
   * @returns {Promise<Object>} Updated document
   */
  updateDocument: async (id, documentData, file = null) => {
    try {
      let filePath = documentData.file_path;
      
      // If a new file is provided, upload it
      if (file) {
        // Upload file to storage
        const timestamp = new Date().getTime();
        const fileExt = file.name.split('.').pop();
        filePath = `${documentData.entity_type}/${documentData.entity_id}/${timestamp}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL for the file
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        filePath = publicUrl;
      }
      
      // Update document
      const updateData = {
        name: documentData.name,
        type: documentData.type,
        issue_date: documentData.issue_date,
        expiry_date: documentData.expiry_date
      };
      
      // Only include file_path if a new file was uploaded
      if (file) {
        updateData.file_path = filePath;
      }
      
      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a document
   * @param {string} id - Document ID
   * @returns {Promise<void>}
   */
  deleteDocument: async (id) => {
    try {
      // Get document details to find file path
      const { data: document, error: getError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      
      // Delete the document record
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Try to delete the file from storage if path exists
      if (document?.file_path) {
        // Extract path from URL
        const urlParts = document.file_path.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folderPath = `${document.entity_type}/${document.entity_id}/`;
        const filePath = folderPath + fileName;
        
        // Attempt to delete file (don't throw if this fails)
        await supabase.storage
          .from('documents')
          .remove([filePath])
          .catch(error => console.warn('Error deleting file, continuing anyway:', error));
      }
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Download a document
   * @param {string} id - Document ID
   * @returns {Promise<string>} Document download URL
   */
  getDocumentDownloadUrl: async (id) => {
    try {
      // Get document details
      const { data: document, error: getError } = await supabase
        .from('documents')
        .select('file_path, name')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      
      if (!document?.file_path) {
        throw new Error('Document file not found');
      }
      
      // Return the file URL
      return document.file_path;
    } catch (error) {
      console.error(`Error getting download URL for document ${id}:`, error);
      throw error;
    }
  }
};

export default DocumentService;