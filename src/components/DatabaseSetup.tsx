
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { SupabaseDataService } from '@/services/supabaseDataService';
import { Database, Download, Upload } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      // This would test the connection
      const employees = await SupabaseDataService.getEmployees();
      toast({
        title: "Connection Successful",
        description: `Connected to Supabase! Found ${employees.length} employees.`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please check your Supabase credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const migrateData = async () => {
    setMigrating(true);
    try {
      await SupabaseDataService.migrateFromLocalStorage();
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Setup</span>
          </CardTitle>
          <CardDescription>
            Configure your Supabase database connection for the attendance system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-url">Supabase Project URL</Label>
            <Input
              id="supabase-url"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supabase-key">Supabase Anon Key</Label>
            <Input
              id="supabase-key"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={testConnection} disabled={testing || !supabaseUrl || !supabaseKey}>
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Data Migration</span>
          </CardTitle>
          <CardDescription>
            Migrate your existing localStorage data to Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={migrateData} disabled={migrating}>
            <Download className="h-4 w-4 mr-2" />
            {migrating ? 'Migrating...' : 'Migrate Local Data to Supabase'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p><strong>1. Create Supabase Project:</strong></p>
            <p className="ml-4">Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a> and create a new project</p>
            
            <p><strong>2. Run the Database Migration:</strong></p>
            <p className="ml-4">Copy the SQL from <code>supabase/migrations/001_initial_schema.sql</code> and run it in your Supabase SQL editor</p>
            
            <p><strong>3. Get Your Credentials:</strong></p>
            <p className="ml-4">Find your Project URL and anon key in Project Settings → API</p>
            
            <p><strong>4. Set Environment Variables:</strong></p>
            <p className="ml-4">Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSetup;
