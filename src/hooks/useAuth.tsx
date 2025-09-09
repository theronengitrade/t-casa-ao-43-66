import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email?: string;
  condominium_id: string | null;
  role: 'super_admin' | 'coordinator' | 'resident' | 'city_viewer';
  first_name: string;
  last_name: string;
  phone: string | null;
  apartment_number: string | null;
  must_change_password: boolean;
  coordination_staff_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkLicense: () => Promise<boolean>;
  isCoordinationMember: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        const profileWithEmail = { ...profileData, email: user.email };
        setProfile(profileWithEmail);
        
        // Log para debug de coordenação
        console.log('Profile refreshed:', {
          coordination_staff_id: profileData.coordination_staff_id,
          role: profileData.role,
          isCoordinationMember: Boolean(profileData.coordination_staff_id)
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const checkLicense = async (): Promise<boolean> => {
    if (profile?.role === 'super_admin') {
      return true;
    }

    if (!profile || !profile.condominium_id) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('status, end_date')
        .eq('condominium_id', profile.condominium_id)
        .maybeSingle();

      if (error) {
        console.error('Error checking license:', error);
        return false;
      }

      if (!data || data.status === 'paused') {
        return false;
      }

      const endDate = new Date(data.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return data.status === 'active' && endDate >= today;
    } catch (error) {
      console.error('Error in checkLicense:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      localStorage.removeItem('supabase.auth.token');
      localStorage.clear();
      
      if (error) {
        if (error.message?.includes('Auth session missing') || 
            error.message?.includes('Session not found')) {
          console.log('Session already expired, cleared local state');
          toast({
            title: "Sessão terminada",
            description: "Logout realizado com sucesso."
          });
        } else {
          console.error('Logout error:', error);
          toast({
            title: "Sessão terminada localmente",
            description: "A sessão foi limpa no seu dispositivo."
          });
        }
      } else {
        toast({
          title: "Sessão terminada",
          description: "Até breve!"
        });
      }
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error('Critical signOut error:', error);
      
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.clear();
      
      toast({
        title: "Sessão terminada",
        description: "Sistema reiniciado com sucesso."
      });
      
      window.location.href = '/';
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('supabase.auth.token');
        if (storedToken) {
          try {
            JSON.parse(storedToken);
          } catch {
            localStorage.removeItem('supabase.auth.token');
            localStorage.clear();
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              setTimeout(() => {
                if (isMounted) {
                  fetchProfile(session.user.id).then(profileData => {
                    if (isMounted) {
                      if (profileData) {
                        const profileWithEmail = { ...profileData, email: session.user.email };
                        setProfile(profileWithEmail);
                      } else {
                        setProfile(profileData);
                      }
                    }
                  }).catch(error => {
                    console.error('Error fetching profile after auth change:', error);
                    if (isMounted) {
                      setProfile(null);
                    }
                  });
                }
              }, 0);
            } else {
              setProfile(null);
            }
            
            setLoading(false);
          }
        );

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session retrieval error:', error);
          localStorage.clear();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            try {
              const profileData = await fetchProfile(session.user.id);
              if (isMounted) {
                if (profileData) {
                  const profileWithEmail = { ...profileData, email: session.user.email };
                  setProfile(profileWithEmail);
                } else {
                  setProfile(profileData);
                }
                setLoading(false);
              }
            } catch (error) {
              console.error('Error fetching initial profile:', error);
              if (isMounted) {
                setProfile(null);
                setLoading(false);
              }
            }
          } else {
            setLoading(false);
          }
        }

        return () => {
          isMounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Critical auth initialization error:', error);
        localStorage.clear();
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      isMounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  // Check if user is a coordination member
  const isCoordinationMember = Boolean(profile?.coordination_staff_id);

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    checkLicense,
    isCoordinationMember,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};