"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "../components/DashboardLayout";
import SampleDataLink from "../components/SampleDataLink";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [periods, setPeriods] = useState('90');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      // Check if it's a CSV file
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a CSV file");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('periods', periods);
      
      const response = await fetch('/api/forecast', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process data');
      }
      
      // Save the forecast result to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('forecastResult', JSON.stringify({
          imagePath: result.imagePath || '',
          csvPath: result.csvPath,
          forecastData: result.forecastData,
          summary: result.summary
        }));
      }
      
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Upload Data">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Upload Your Data</h2>
        <p className="text-gray-600 mb-6">
          Upload your data files to begin analysis and forecasting.
        </p>
        
        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <div className="mr-3">✅</div>
              <div>
                <p className="font-medium">Data uploaded successfully!</p>
                <p className="text-sm">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <div className="mb-4 text-3xl">📤</div>
              <p className="text-gray-600 mb-2">
                {file ? file.name : 'Drag and drop files here, or click to select files'}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supported format: CSV with date and quantity_sold columns
              </p>
              {!file && (
                <button 
                  type="button"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-upload')?.click();
                  }}
                >
                  Select Files
                </button>
              )}
            </div>
            
            {file && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forecast Period (Days)
                  </label>
                  <input
                    type="number"
                    value={periods}
                    onChange={(e) => setPeriods(e.target.value)}
                    min="1"
                    max="365"
                    className="border border-gray-300 rounded-md p-2 w-full"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Upload and Generate Forecast'}
                </button>
              </div>
            )}
            
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                {error}
              </div>
            )}
          </form>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Need sample data?</h3>
          <p className="text-xs text-gray-600 mb-2">
            If you don't have your own data yet, you can download our sample dataset to test the forecasting functionality.
          </p>
          <SampleDataLink />
        </div>
      </div>
    </DashboardLayout>
  );
} 