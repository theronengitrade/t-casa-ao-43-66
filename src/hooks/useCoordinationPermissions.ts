import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserPermissions {
  all?: boolean;
  payments?: boolean;
  expenses?: boolean;
  payroll?: boolean;
  financial_reports?: boolean;
  visitors?: boolean;
  qr_codes?: boolean;
  occurrences?: boolean;
  announcements?: boolean;
  action_plans?: boolean;
  service_providers?: boolean;
  residents?: boolean;
  documents?: boolean;
  space_reservations?: boolean;
}

export const useCoordinationPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const checkPermissions = async () => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }

    try {
      // Se é coordenador, tem todas as permissões
      if (profile.role === 'coordinator') {
        setPermissions({ all: true });
        setLoading(false);
        return;
      }

      // Verificar permissões específicas da coordenação
      const { data, error } = await supabase
        .rpc('get_coordination_member_permissions', {
          _user_id: profile.user_id
        });

      if (error) {
        console.error('Error fetching permissions:', error);
        setPermissions({});
      } else {
        // A função retorna jsonb, então precisamos converter para o formato esperado
        const permissionsData = data as any;
        setPermissions(permissionsData || {});
      }
    } catch (error) {
      console.error('Error in checkPermissions:', error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions.all === true || permissions[permission] === true;
  };

  const hasAnyPermission = (): boolean => {
    return permissions.all === true || Object.values(permissions).some(value => value === true);
  };

  useEffect(() => {
    checkPermissions();
  }, [profile?.user_id, profile?.coordination_staff_id]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    checkPermissions
  };
};