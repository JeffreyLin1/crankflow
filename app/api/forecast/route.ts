import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const execAsync = promisify(exec);

function validateCsvData(filePath: string): { valid: boolean; message?: string } {
  try {
    const csvData = fs.readFileSync(filePath, 'utf8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Check if we have enough data points
    if (records.length < 14) {
      return { 
        valid: false, 
        message: 'CSV file must contain at least 14 days of data for accurate forecasting'
      };
    }
    
    // Check for negative values
    const hasNegative = records.some((record: any) => 
      parseFloat(record.quantity_sold) < 0
    );
    
    if (hasNegative) {
      return {
        valid: false,
        message: 'CSV contains negative quantity values, which are not valid for inventory data'
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      message: `Error validating CSV: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const periods = formData.get('periods') as string || '90';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save the uploaded file
    const filePath = path.join(uploadsDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    
    // Validate the uploaded file
    const validation = validateCsvData(filePath);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'public', 'forecasts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate unique output filename
    const timestamp = new Date().getTime();
    const outputCsvName = `forecast_${timestamp}.csv`;
    const outputCsvPath = path.join(outputDir, outputCsvName);
    const publicCsvPath = `/forecasts/${outputCsvName}`;
    
    // Execute the Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'forecasting', 'forecast.py');
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${filePath}" --periods ${periods} --csv "${outputCsvPath}"`
    );
    
    // Check if the CSV file was actually created
    if (!fs.existsSync(outputCsvPath)) {
      console.error('Forecast CSV file was not created:', stderr);
      return NextResponse.json({ 
        error: 'Failed to generate forecast data',
        details: 'The forecast process did not complete successfully'
      }, { status: 500 });
    }
    
    // Check for errors in stderr, but ignore common warnings
    if (stderr && 
        !stderr.includes('UserWarning') && 
        !stderr.includes('cmdstanpy - INFO')) {
      console.error('Error running forecast script:', stderr);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }
    
    // Parse the forecast summary from stdout
    const summaryLines = stdout.split('\n').filter(line => 
      line.includes('Forecast for') || line.includes('Last date in historical data')
    );
    
    // Read and parse the CSV data
    const csvData = fs.readFileSync(outputCsvPath, 'utf8');
    const forecastData = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    return NextResponse.json({ 
      message: 'Forecast generated successfully',
      csvPath: publicCsvPath,
      forecastData,
      summary: summaryLines,
      output: stdout
    });
    
  } catch (error) {
    console.error('Error processing forecast request:', error);
    return NextResponse.json({ 
      error: 'Failed to generate forecast',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 