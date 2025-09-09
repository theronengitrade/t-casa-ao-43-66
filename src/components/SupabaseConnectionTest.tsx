import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = React.useState<string>('Testing...');

  React.useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          setConnectionStatus(`Error: ${error.message}`);
        } else {
          setConnectionStatus('✅ Supabase connected successfully!');
        }
      } catch (err: any) {
        setConnectionStatus(`Connection failed: ${err.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{connectionStatus}</p>
      </CardContent>
    </Card>
  );
}