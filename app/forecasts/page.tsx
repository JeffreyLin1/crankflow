'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from "../components/DashboardLayout";
import Image from 'next/image';
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

type ForecastDataPoint = {
  date: string;
  forecast: number;
  lower_bound: number;
  upper_bound: number;
  is_forecast: boolean;
  historical_end: boolean;
};

type PriceDataPoint = {
  date: string;
  price: number;
  quantity_sold: number;
};

export default function ForecastsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [periods, setPeriods] = useState('90');
  const [loading, setLoading] = useState(false);
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
  
  // Add this state variable with your other state variables
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  
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

  // Add this function to calculate price elasticity using regression analysis
  const calculatePriceElasticity = (priceData: PriceDataPoint[]): number => {
    if (priceData.length < 5) {
      // Not enough data points for reliable calculation
      return -1.2; // Default fallback value
    }

    // Calculate log values for regression
    const logPrices = priceData.map(d => Math.log(d.price));
    const logQuantities = priceData.map(d => Math.log(d.quantity_sold));

    // Calculate means
    const meanLogPrice = logPrices.reduce((sum, val) => sum + val, 0) / logPrices.length;
    const meanLogQuantity = logQuantities.reduce((sum, val) => sum + val, 0) / logQuantities.length;

    // Calculate regression components
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < priceData.length; i++) {
      const priceDiff = logPrices[i] - meanLogPrice;
      const quantityDiff = logQuantities[i] - meanLogQuantity;
      
      numerator += priceDiff * quantityDiff;
      denominator += priceDiff * priceDiff;
    }

    // Calculate elasticity (slope of log-log regression)
    const elasticity = denominator !== 0 ? numerator / denominator : -1.2;
    
    // Price elasticity is typically negative (price up, demand down)
    return Math.max(Math.min(elasticity, 0), -3); // Constrain between 0 and -3 for realistic values
  };

  // Modify your useEffect for forecast metrics to use this function
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
      
      // Generate sample price data if not available
      // In a real app, this would come from your database
      if (priceData.length === 0) {
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
        return; // Exit early to prevent calculating with empty price data
      }
      
      // Calculate price elasticity using regression
      const priceElasticityEstimate = calculatePriceElasticity(priceData);
      
      setForecastMetrics({
        totalUnits: Math.round(totalUnits),
        peakDemandDate: peakDemand.date,
        estimatedOutOfStockDate: outOfStockDate || 'N/A',
        suggestedReorderQty,
        priceElasticityEstimate
      });
    }
  }, [forecastResult, priceData.length]); // Only depend on priceData.length, not the entire array

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
        throw new Error(result.error || 'Failed to generate forecast');
      }
      
      setForecastResult({
        imagePath: result.imagePath,
        csvPath: result.csvPath,
        forecastData: result.forecastData,
        summary: result.summary,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data if forecast result exists
  const chartData = filteredData.length > 0 ? {
    labels: filteredData.map(d => d.date),
    datasets: [
      // Only show forecast line if in smoothed mode
      ...(viewMode === 'smoothed' ? [{
        label: 'Forecast',
        data: filteredData.map(d => d.forecast),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderWidth: 2,
      }] : []),
      
      // Show raw data points for historical data
      {
        label: 'Actual Sales',
        data: filteredData.map((d, i) => d.is_forecast ? null : d.forecast),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        pointRadius: 4,
        pointHoverRadius: 6,
        showLine: viewMode === 'raw',
      },
      
      // Confidence intervals
      ...(showConfidenceInterval ? [
        {
          label: 'Lower Bound',
          data: filteredData.map(d => d.is_forecast ? d.lower_bound : null),
          borderColor: 'rgba(53, 162, 235, 0.3)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: '+1',
        },
        {
          label: 'Upper Bound',
          data: filteredData.map(d => d.is_forecast ? d.upper_bound : null),
          borderColor: 'rgba(53, 162, 235, 0.3)',
          backgroundColor: 'rgba(53, 162, 235, 0.1)',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        }
      ] : []),
      
      // Rolling average
      ...(showRollingAverage ? [{
        label: '7-Day Rolling Average',
        data: rollingAverageData,
        borderColor: 'rgba(255, 159, 64, 0.8)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
      }] : []),
      
      // Reorder zone (example - you might want to calculate this based on your business logic)
      ...(showReorderZone ? [{
        label: 'Reorder Zone',
        data: filteredData.map(() => 10), // Example threshold
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 1,
        borderDash: [10, 5],
        pointRadius: 0,
        fill: false,
      }] : []),
    ],
  } : null;

  return (
    <DashboardLayout title="Forecasts">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Create a New Forecast</h2>
        <p className="text-gray-600 mb-6">
          Upload your sales data to generate a forecast.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="mb-3">📤</div>
                <p className="text-gray-600 mb-2">
                  {file ? file.name : 'Click to select a CSV file'}
                </p>
                <p className="text-xs text-gray-500">
                  File must contain date and quantity_sold columns
                </p>
              </label>
            </div>
          </div>
          
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
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading || !file}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
              loading || !file ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Generating Forecast...' : 'Generate Forecast'}
          </button>
        </form>
      </div>
      
      {forecastResult ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Forecast Results</h2>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {forecastResult.summary.map((line, index) => (
                <p key={index} className="text-sm mb-1">{line}</p>
              ))}
            </div>
          </div>
          
          {/* Forecast Metrics */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Forecast Metrics</h3>
            <div className="overflow-hidden bg-white shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Forecast Period
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Next {periods} days
                    </td>
                  </tr>
                  {forecastMetrics && (
                    <>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Total Units Forecasted
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {forecastMetrics.totalUnits.toLocaleString()} units
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Peak Demand Date
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {forecastMetrics.peakDemandDate}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Estimated Out-of-Stock Date
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {forecastMetrics.estimatedOutOfStockDate}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Suggested Reorder Qty
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {forecastMetrics.suggestedReorderQty} units
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Price Elasticity Estimate
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {forecastMetrics.priceElasticityEstimate}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Forecast Chart</h3>
            
            {/* Chart Controls */}
            <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setDateRange('30')}
                    className={`px-3 py-1 text-sm rounded ${dateRange === '30' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    30 Days
                  </button>
                  <button 
                    onClick={() => setDateRange('60')}
                    className={`px-3 py-1 text-sm rounded ${dateRange === '60' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    60 Days
                  </button>
                  <button 
                    onClick={() => setDateRange('90')}
                    className={`px-3 py-1 text-sm rounded ${dateRange === '90' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    90 Days
                  </button>
                  <button 
                    onClick={() => setDateRange('all')}
                    className={`px-3 py-1 text-sm rounded ${dateRange === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    All
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Mode
                </label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'raw' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Raw Sales
                  </button>
                  <button 
                    onClick={() => setViewMode('smoothed')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'smoothed' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Smoothed Forecast
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Options
                </label>
                <div className="flex flex-wrap gap-3">
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
                    <span className="ml-2 text-sm text-gray-700">Rolling Average</span>
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
                </div>
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
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Forecast Data</h3>
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
          
          <div className="flex space-x-4">
            <button
              onClick={() => setForecastResult(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              Create Another Forecast
            </button>
            <a 
              href={forecastResult.csvPath} 
              download 
              className="text-blue-600 hover:text-blue-800"
            >
              Download CSV
            </a>
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center py-12">
            <div className="mb-4 text-4xl">📈</div>
            <h3 className="text-lg font-medium mb-2">No Forecasts Yet</h3>
            <p className="text-gray-600 mb-4">
              Upload your sales data and generate your first forecast using the form above.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 