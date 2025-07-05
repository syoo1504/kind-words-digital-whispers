
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface FileUploadScannerProps {
  onScanSuccess: (qrData: string) => void;
}

const FileUploadScanner: React.FC<FileUploadScannerProps> = ({ onScanSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const processUploadedFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a QR code image to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a canvas to read the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        try {
          // Use html5-qrcode library to decode from canvas
          const { Html5Qrcode } = await import('html5-qrcode');
          const html5QrCode = new Html5Qrcode('temp-qr-reader');
          
          // Convert canvas to blob and then scan
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const result = await html5QrCode.scanFile(selectedFile, true);
                onScanSuccess(result);
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('qr-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              } catch (error) {
                toast({
                  title: "Scan Failed",
                  description: "Could not detect QR code in the uploaded image",
                  variant: "destructive",
                });
              }
            }
          });
        } catch (error) {
          toast({
            title: "Processing Error",
            description: "Failed to process the uploaded image",
            variant: "destructive",
          });
        }
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process the uploaded file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📁 Upload QR Image</CardTitle>
        <CardDescription>
          Upload a QR code image from your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="qr-file-input">Select QR Code Image</Label>
          <Input
            id="qr-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="mt-1"
          />
        </div>
        
        {selectedFile && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Selected: {selectedFile.name}
            </p>
          </div>
        )}
        
        <Button 
          onClick={processUploadedFile}
          disabled={!selectedFile}
          className="w-full"
        >
          Process QR Image
        </Button>
      </CardContent>
    </Card>
  );
};

export default FileUploadScanner;
