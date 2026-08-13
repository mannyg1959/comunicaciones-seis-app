import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children, user }) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions({});
        setLoading(false);
        return;
      }

      try {
        const userRole = user.role || 'Ventas'; // Default role if not set
        const { data, error } = await supabase
          .from('roles_permissions')
          .select('permissions')
          .eq('role_name', userRole)
          .single();

        if (error) {
          console.error('Error fetching permissions:', error);
          // Fallback to basic structure to avoid crashing
          setPermissions({});
        } else if (data) {
          setPermissions(data.permissions);
        }
      } catch (err) {
        console.error('Unexpected error fetching permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  // Helper function to check if the user has a specific permission
  // Example usage: hasPermission('cotizaciones', 'eliminar')
  const hasPermission = (module, action) => {
    if (loading) return false; // Default to false while loading
    if (!permissions || !permissions[module]) return false;
    return permissions[module][action] === true;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, loading, setPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
