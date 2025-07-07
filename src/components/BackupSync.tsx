
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Upload, Database, RefreshCw } from 'lucide-react';
import { SecureDataService } from '@/services/secureDataService';

const BackupSync = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backup = SecureDataService.createSecureBackup();
      const backupJson = JSON.stringify(backup, null, 2);
      
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup Created",
        description: "Your data has been successfully backed up and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      const success = SecureDataService.restoreFromSecureBackup(backupData);
      
      if (success) {
        toast({
          title: "Restore Successful",
          description: "Your data has been successfully restored from backup.",
        });
        // Refresh the page to reflect changes
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('Restore operation failed');
      }
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore backup. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const getDataSummary = () => {
    const employees = SecureDataService.getEmployeeData();
    const records = SecureDataService.getAttendanceRecords();
    
    return {
      employeeCount: employees.length,
      recordCount: records.length,
      lastUpdated: new Date().toLocaleString()
    };
  };

  const clearAllData = () => {
    const success = SecureDataService.clearAllData();
    if (success) {
      toast({
        title: "Data Cleared",
        description: "All data has been cleared and sample data has been restored.",
      });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast({
        title: "Clear Failed",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const summary = getDataSummary();

  return (
    <div className="space-y-6">
      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Summary
          </CardTitle>
          <CardDescription>Current system data overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.employeeCount}</div>
              <div className="text-sm text-gray-600">Total Employees</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.recordCount}</div>
              <div className="text-sm text-gray-600">Attendance Records</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-600">Last Updated</div>
              <div className="text-xs text-gray-600">{summary.lastUpdated}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
          <CardDescription>
            Create backups of your data or restore from previous backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Backup */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Create Backup</h4>
              <p className="text-sm text-gray-600">Download a complete backup of all employee and attendance data</p>
            </div>
            <Button 
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="flex items-center gap-2"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isCreatingBackup ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>

          {/* Restore Backup */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Restore from Backup</h4>
              <p className="text-sm text-gray-600">Upload and restore data from a previous backup file</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                disabled={isRestoring}
                className="w-48"
              />
              <Button disabled={isRestoring} variant="outline">
                {isRestoring ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will affect your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear All Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all employee records 
                  and attendance data from the system. Sample data will be restored.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllData} className="bg-red-600 hover:bg-red-700">
                  Yes, clear all data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSync;
