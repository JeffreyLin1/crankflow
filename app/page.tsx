"use client";

import DashboardLayout from "./components/DashboardLayout";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define types for forecast data
type ForecastDataPoint = {
  date: string;
  forecast: number;
  lower_bound: number;
  upper_bound: number;
  is_forecast: boolean;
  historical_end: boolean;
};

type ForecastMetrics = {
  totalUnits: number;
  peakDemandDate: string;
  estimatedOutOfStockDate: string;
  suggestedReorderQty: number;
  priceElasticityEstimate: number;
};

type PriceDataPoint = {
  date: string;
  price: number;
  quantity_sold: number;
};

// Functions to save and load forecast data from localStorage
const loadForecastFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const savedForecast = localStorage.getItem('forecastResult');
    return savedForecast ? JSON.parse(savedForecast) : null;
  }
  return null;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [periods, setPeriods] = useState('90');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastResult, setForecastResult] = useState<{
    imagePath: string;
    csvPath: string;
    forecastData: ForecastDataPoint[];
    summary: string[];
  } | null>(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState<'30' | '60' | '90' | 'all'>('all');
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [showRollingAverage, setShowRollingAverage] = useState(false);
  const [showReorderZone, setShowReorderZone] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'smoothed'>('smoothed');
  
  // Derived state for filtered data
  const [filteredData, setFilteredData] = useState<ForecastDataPoint[]>([]);
  const [rollingAverageData, setRollingAverageData] = useState<number[]>([]);
  
  // Forecast metrics
  const [forecastMetrics, setForecastMetrics] = useState<{
    totalUnits: number;
    peakDemandDate: string;
    estimatedOutOfStockDate: string;
    suggestedReorderQty: number;
    priceElasticityEstimate: number;
  } | null>(null);
  
  // Price data state
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  
  // Load saved forecast on initial render
  useEffect(() => {
    const savedForecast = loadForecastFromLocalStorage();
    if (savedForecast) {
      setForecastResult(savedForecast);
    }
    setLoading(false);
  }, []);
  
  // Calculate rolling average (7-day)
  useEffect(() => {
    if (forecastResult) {
      const windowSize = 7;
      const rawData = forecastResult.forecastData.map(d => parseFloat(d.forecast as any));
      const result = [];
      
      for (let i = 0; i < rawData.length; i++) {
        if (i < windowSize - 1) {
          // Not enough data for full window
          const slice = rawData.slice(0, i + 1);
          result.push(slice.reduce((sum, val) => sum + val, 0) / slice.length);
        } else {
          // Full window
          const slice = rawData.slice(i - windowSize + 1, i + 1);
          result.push(slice.reduce((sum, val) => sum + val, 0) / windowSize);
        }
      }
      
      setRollingAverageData(result);
    }
  }, [forecastResult]);
  
  // Apply filters
  useEffect(() => {
    if (forecastResult) {
      let filtered = [...forecastResult.forecastData];
      
      // Apply date range filter
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        // Find the index where forecast starts
        const forecastStartIndex = filtered.findIndex(d => d.is_forecast);
        if (forecastStartIndex !== -1) {
          // Keep all historical data plus the specified number of forecast days
          filtered = [
            ...filtered.slice(0, forecastStartIndex),
            ...filtered.slice(forecastStartIndex, forecastStartIndex + days)
          ];
        }
      }
      
      setFilteredData(filtered);
    }
  }, [forecastResult, dateRange]);
  
  // Calculate forecast metrics
  useEffect(() => {
    if (forecastResult && forecastResult.forecastData.length > 0) {
      // Get only forecast data (not historical)
      const forecastOnly = forecastResult.forecastData.filter(d => d.is_forecast);
      
      if (forecastOnly.length === 0) return;
      
      // Calculate total units forecasted
      const totalUnits = forecastOnly.reduce((sum, item) => 
        sum + parseFloat(item.forecast as any), 0);
      
      // Find peak demand date
      const peakDemand = forecastOnly.reduce((max, item) => 
        parseFloat(item.forecast as any) > parseFloat(max.forecast as any) ? item : max, forecastOnly[0]);
      
      // Simulate out-of-stock date (assuming current stock is 30 units)
      const currentStock = 30; // This would come from your inventory system
      let runningTotal = 0;
      let outOfStockDate = '';
      
      for (const item of forecastOnly) {
        runningTotal += parseFloat(item.forecast as any);
        if (runningTotal >= currentStock && !outOfStockDate) {
          outOfStockDate = item.date;
          break;
        }
      }
      
      // Calculate suggested reorder quantity (simple example)
      const suggestedReorderQty = Math.ceil(totalUnits * 0.3); // 30% of total forecast
      
      // Calculate price elasticity
      const priceElasticityEstimate = -1.2; // Default value
      
      setForecastMetrics({
        totalUnits: Math.round(totalUnits),
        peakDemandDate: peakDemand.date,
        estimatedOutOfStockDate: outOfStockDate || 'Not within forecast period',
        suggestedReorderQty: suggestedReorderQty,
        priceElasticityEstimate: priceElasticityEstimate
      });
    }
  }, [forecastResult]);
  
  // Generate sample price data in a separate effect that runs only once
  useEffect(() => {
    if (forecastResult && forecastResult.forecastData.length > 0 && priceData.length === 0) {
      // Generate sample price/sales data for demonstration
      const samplePriceData: PriceDataPoint[] = [];
      const historicalData = forecastResult.forecastData.filter(d => !d.is_forecast);
      
      for (let i = 0; i < historicalData.length; i++) {
        // Create realistic price variations
        const basePrice = 100; // Base price of the product
        const priceVariation = Math.sin(i / 10) * 15; // Price varies by ±15
        const price = basePrice + priceVariation;
        
        samplePriceData.push({
          date: historicalData[i].date,
          price: price,
          quantity_sold: parseFloat(historicalData[i].forecast as any)
        });
      }
      
      setPriceData(samplePriceData);
    }
  }, [forecastResult, priceData.length]);
  
  // Prepare chart data
  const chartData = forecastResult && filteredData.length > 0 ? {
    labels: filteredData.map(d => d.date),
    datasets: [
      // Historical and forecast data
      {
        label: 'Sales Forecast',
        data: filteredData.map(d => parseFloat(d.forecast as any)),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderWidth: 2,
        tension: viewMode === 'smoothed' ? 0.4 : 0,
      },
      // Confidence intervals (upper bound)
      ...(showConfidenceInterval ? [{
        label: 'Upper Bound',
        data: filteredData.map(d => d.is_forecast ? parseFloat(d.upper_bound as any) : null),
        borderColor: 'rgba(53, 162, 235, 0.3)',
        backgroundColor: 'rgba(53, 162, 235, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: '+1',
      }] : []),
      // Confidence intervals (lower bound)
      ...(showConfidenceInterval ? [{
        label: 'Lower Bound',
        data: filteredData.map(d => d.is_forecast ? parseFloat(d.lower_bound as any) : null),
        borderColor: 'rgba(53, 162, 235, 0.3)',
        backgroundColor: 'rgba(53, 162, 235, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }] : []),
      // Rolling average
      ...(showRollingAverage ? [{
        label: '7-Day Average',
        data: rollingAverageData,
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0)',
        borderWidth: 2,
        borderDash: [3, 3],
        pointRadius: 0,
      }] : []),
      // Reorder zone
      ...(showReorderZone ? [{
        label: 'Reorder Zone',
        data: filteredData.map(() => 10), // Example threshold
        borderColor: 'rgba(255, 159, 64, 0.8)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: true,
      }] : []),
    ],
  } : null;
  
  // Function to clear forecast and start over
  const clearForecast = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forecastResult');
    }
    setForecastResult(null);
    setFilteredData([]);
    setForecastMetrics(null);
  };

  return (
    <DashboardLayout title="Dashboard">
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      ) : forecastResult ? (
        <div>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Forecasted Units</h3>
              <p className="text-3xl font-bold">{forecastMetrics?.totalUnits.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Peak Demand Date</h3>
              <p className="text-3xl font-bold">{forecastMetrics?.peakDemandDate || 'N/A'}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-red-600">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Est. Out-of-Stock Date</h3>
              <p className="text-3xl font-bold">{forecastMetrics?.estimatedOutOfStockDate || 'N/A'}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-green-600">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Suggested Reorder Qty</h3>
              <p className="text-3xl font-bold">{forecastMetrics?.suggestedReorderQty || 0}</p>
            </div>
          </div>
          
          {/* Forecast Visualization */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Forecast Visualization</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setDateRange('30')}
                  className={`px-3 py-1 text-xs rounded ${dateRange === '30' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  30 Days
                </button>
                <button 
                  onClick={() => setDateRange('60')}
                  className={`px-3 py-1 text-xs rounded ${dateRange === '60' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  60 Days
                </button>
                <button 
                  onClick={() => setDateRange('90')}
                  className={`px-3 py-1 text-xs rounded ${dateRange === '90' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  90 Days
                </button>
                <button 
                  onClick={() => setDateRange('all')}
                  className={`px-3 py-1 text-xs rounded ${dateRange === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  All
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showConfidenceInterval}
                    onChange={() => setShowConfidenceInterval(!showConfidenceInterval)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Confidence Interval</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showRollingAverage}
                    onChange={() => setShowRollingAverage(!showRollingAverage)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">7-Day Average</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showReorderZone}
                    onChange={() => setShowReorderZone(!showReorderZone)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Reorder Zone</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={viewMode === 'smoothed'}
                    onChange={() => setViewMode(viewMode === 'smoothed' ? 'raw' : 'smoothed')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Smoothed Line</span>
                </label>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 h-80">
              {chartData && <Line data={chartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Quantity'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    },
                    ticks: {
                      maxTicksLimit: 12
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Bike Sales Forecast'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.raw !== null ? parseFloat(context.raw as any).toFixed(0) : 'N/A';
                        return `${label}: ${value}`;
                      }
                    }
                  },
                  annotation: {
                    annotations: {
                      line1: {
                        type: 'line',
                        xMin: filteredData.findIndex(d => d.historical_end),
                        xMax: filteredData.findIndex(d => d.historical_end),
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        label: {
                          content: 'Historical | Forecast',
                          enabled: true
                        }
                      }
                    }
                  }
                }
              }} />}
            </div>
          </div>
          
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Forecast Summary</h2>
              <div className="border border-gray-200 p-4 rounded-lg">
                <div className="text-gray-600 text-sm space-y-1">
                  {forecastResult.summary.map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Recommendations</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Consider reordering by {forecastMetrics?.estimatedOutOfStockDate || 'N/A'}</li>
                  <li>Prepare for peak demand on {forecastMetrics?.peakDemandDate || 'N/A'}</li>
                  <li>Optimal order quantity: {forecastMetrics?.suggestedReorderQty || 0} units</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Forecast Data</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecast</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lower Bound</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upper Bound</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.slice(0, 10).map((row, index) => (
                      <tr key={index} className={row.historical_end ? "bg-blue-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.is_forecast ? 'Forecast' : 'Historical'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(row.forecast as any).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.is_forecast ? parseFloat(row.lower_bound as any).toFixed(2) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.is_forecast ? parseFloat(row.upper_bound as any).toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length > 10 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    Showing 10 of {filteredData.length} rows
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/forecasts" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Detailed Forecast
              </Link>
              <a 
                href={forecastResult.csvPath} 
                download 
                className="inline-block px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                Download Forecast Data
              </a>
              <button
                onClick={clearForecast}
                className="inline-block px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Create New Forecast
              </button>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  📈
                </div>
                <div>
                  <p className="text-sm font-medium">Forecast Generated</p>
                  <p className="text-xs text-gray-500">A new forecast was created for the next {filteredData.filter(d => d.is_forecast).length} days</p>
                </div>
                <div className="ml-auto text-xs text-gray-500">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // No forecast data available
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Active Forecasts</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Data Sets</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Welcome Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Welcome to CrankFlow</h2>
              <p className="text-gray-600 mb-4">
                This is your dashboard where you can manage your data, forecasts, and products.
                Use the sidebar navigation to access different sections of the application.
              </p>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Quick Start</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Upload your first dataset</li>
                  <li>Create a forecast model</li>
                  <li>Configure product settings</li>
                  <li>View analytics and reports</li>
                </ul>
              </div>
            </div>

            {/* No Forecast Data */}
            <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Forecast Overview</h2>
              </div>

              <div className="text-center py-10 border border-gray-200 rounded-lg">
                <div className="mb-3 text-3xl">📈</div>
                <h3 className="text-lg font-medium mb-2">No Forecast Data Available</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  To get started, upload your sales data and create your first forecast to see predictions and insights about your inventory needs.
                </p>
                <div className="flex justify-center gap-4">
                  <Link 
                    href="/upload" 
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Upload Data
                  </Link>
                  <Link 
                    href="/forecasts" 
                    className="inline-block px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Create Forecast
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-gray-600 text-sm">
                No recent activity to display. Start by uploading data or creating a forecast.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
