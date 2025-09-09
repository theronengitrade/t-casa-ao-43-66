import { createContext, useContext, useEffect } from 'react';
import { useFinancialSync } from '@/hooks/useFinancialSync';
import { useAuth } from '@/hooks/useAuth';

interface FinancialSyncContextType {
  stats: any;
  payments: any[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const FinancialSyncContext = createContext<FinancialSyncContextType | null>(null);

export const FinancialSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const financialSync = useFinancialSync(profile?.condominium_id);

  return (
    <FinancialSyncContext.Provider value={financialSync}>
      {children}
    </FinancialSyncContext.Provider>
  );
};

export const useGlobalFinancialSync = () => {
  const context = useContext(FinancialSyncContext);
  if (!context) {
    throw new Error('useGlobalFinancialSync deve ser usado dentro do FinancialSyncProvider');
  }
  return context;
};