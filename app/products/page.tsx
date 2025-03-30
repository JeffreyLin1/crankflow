import DashboardLayout from "../components/DashboardLayout";

export default function ProductsPage() {
  return (
    <DashboardLayout title="Products">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        <p className="text-gray-600 mb-6">
          Manage your product catalog and inventory.
        </p>
        
        <div className="text-center py-12">
          <div className="mb-4 text-4xl">📦</div>
          <h3 className="text-lg font-medium mb-2">No Products Added</h3>
          <p className="text-gray-600 mb-4">
            You haven't added any products yet. Add your first product to get started.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Add Product
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
} 