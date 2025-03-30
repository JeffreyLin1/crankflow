import DashboardLayout from "../components/DashboardLayout";

export default function UploadPage() {
  return (
    <DashboardLayout title="Upload Data">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Upload Your Data</h2>
        <p className="text-gray-600 mb-6">
          Upload your data files to begin analysis and forecasting.
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="mb-4">📤</div>
          <p className="text-gray-600 mb-2">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: CSV, Excel, JSON
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Select Files
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
} 