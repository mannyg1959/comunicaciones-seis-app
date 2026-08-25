import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { defaultPermissions } from '../utils/permissions';

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
        let userRole = user.role || 'Ventas';
        if (userRole === 'Administrador') userRole = 'Admin';
        const { data, error } = await supabase
          .from('roles_permissions')
          .select('permissions')
          .eq('role_name', userRole)
          .single();

        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions(defaultPermissions[userRole] || {});
        } else if (data) {
          // Fusionar con los permisos por defecto para evitar que falten nuevas opciones agregadas al código pero que aún no están en Supabase
          const defaultPerms = defaultPermissions[userRole] || {};
          const mergedPerms = { ...defaultPerms };
          Object.keys(data.permissions || {}).forEach(module => {
            mergedPerms[module] = { ...defaultPerms[module], ...data.permissions[module] };
            
            // Regla de Negocio: El Administrador Principal SIEMPRE tiene acceso total.
            // Esto previene que configuraciones erróneas en la base de datos bloqueen al admin.
            if (userRole === 'Admin') {
              Object.keys(mergedPerms[module]).forEach(action => {
                mergedPerms[module][action] = true;
              });
            }
          });
          setPermissions(mergedPerms);
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
