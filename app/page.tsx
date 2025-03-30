import DashboardLayout from "./components/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
          <p className="text-3xl font-bold">128</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Active Forecasts</h3>
          <p className="text-3xl font-bold">24</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Data Sets</h3>
          <p className="text-3xl font-bold">16</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Welcome to CrankFlow</h2>
        <p className="text-gray-600 mb-4">
          This is your dashboard where you can manage your data, forecasts, and products.
          Use the sidebar navigation to access different sections of the application.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Quick Start</h3>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
              <li>Upload your first dataset</li>
              <li>Create a forecast model</li>
              <li>Configure product settings</li>
              <li>View analytics and reports</li>
            </ul>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Recent Activity</h3>
            <p className="text-gray-600 text-sm">
              No recent activity to display. Start by uploading data or creating a forecast.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
