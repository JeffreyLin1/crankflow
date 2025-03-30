export default function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            🔔
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
} 