import Link from "next/link";
import Image from "next/image";

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: "dashboard" },
  { name: "Upload Data", href: "/upload", icon: "upload" },
  { name: "Forecasts", href: "/forecasts", icon: "chart" },
  { name: "Products", href: "/products", icon: "box" },
];

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gray-100 text-gray-800 flex flex-col fixed left-0 top-0 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/next.svg"
            alt="CrankFlow Logo"
            width={32}
            height={32}
          />
          <span className="text-xl font-semibold">CrankFlow</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  {/* Simple icon placeholders */}
                  {item.icon === "dashboard" && "📊"}
                  {item.icon === "upload" && "📤"}
                  {item.icon === "chart" && "📈"}
                  {item.icon === "box" && "📦"}
                </span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            👤
          </div>
          <div>
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-gray-500">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
} 