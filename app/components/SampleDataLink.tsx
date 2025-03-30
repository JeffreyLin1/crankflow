import Link from 'next/link';

export default function SampleDataLink() {
  return (
    <Link 
      href="/sample_sales_data.csv" 
      className="text-blue-600 hover:text-blue-800 text-sm"
      download
    >
      Download Sample CSV
    </Link>
  );
} 