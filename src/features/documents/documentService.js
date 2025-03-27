// src/features/documents/documentService.js
import supabase from '../../lib/supabase';

const documentService = {
  getDocuments: async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number),
          driver:driver_id(id, name)
        `)
        .order('expiry_date');
      
      if (error) throw error;
      
      return data.map(doc => {
        // Determine entity name based on entity type
        let entityName = '';
        if (doc.entity_type === 'vehicle' && doc.vehicle) {
          entityName = doc.vehicle.plate_number;
        } else if (doc.entity_type === 'driver' && doc.driver) {
          entityName = doc.driver.name;
        }
        
        // Calculate status based on expiry date
        const today = new Date();
        const expiryDate = new Date(doc.expiry_date);
        const daysToExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'valid';
        if (daysToExpiry < 0) {
          status = 'expired';
        } else if (daysToExpiry < 30) {
          status = 'expiring_soon';
        }
        
        return {
          ...doc,
          entity_name: entityName,
          status
        };
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },
  
  getDocumentsByEntity: async (entityType, entityId) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('expiry_date');
      
      if (error) throw error;
      
      return data.map(doc => {
        // Calculate status based on expiry date
        const today = new Date();
        const expiryDate = new Date(doc.expiry_date);
        const daysToExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'valid';
        if (daysToExpiry < 0) {
          status = 'expired';
        } else if (daysToExpiry < 30) {
          status = 'expiring_soon';
        }
        
        return {
          ...doc,
          status
        };
      });
    } catch (error) {
      console.error(`Error fetching documents for ${entityType} ${entityId}:`, error);
      throw error;
    }
  },
  
  addDocument: async (documentData, file) => {
    try {
      // Upload file to storage
      const timestamp = new Date().getTime();
      const filePath = `${documentData.entity_type}/${documentData.entity_id}/${timestamp}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // Insert document record
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
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },
  
  getDocumentDownloadUrl: async (documentId) => {
    try {
      // Get document details
      const { data, error } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      
      if (!data?.file_path) {
        throw new Error('Document file not found');
      }
      
      return data.file_path;
    } catch (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }
  },
  
  deleteDocument: async (documentId) => {
    try {
      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};

export default documentService;