import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({
  children,
  title = "Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-auto">
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
} 