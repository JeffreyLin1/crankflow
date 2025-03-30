import pandas as pd
from prophet import Prophet
import argparse
from datetime import datetime
import os

def load_data(file_path):
    """Load sales data from CSV file."""
    try:
        df = pd.read_csv(file_path)
        # Check if required columns exist
        if 'date' not in df.columns or 'quantity_sold' not in df.columns:
            raise ValueError("CSV must contain 'date' and 'quantity_sold' columns")
        
        # Convert to Prophet's required format (ds and y columns)
        df = df.rename(columns={'date': 'ds', 'quantity_sold': 'y'})
        
        # Ensure date is in correct format
        df['ds'] = pd.to_datetime(df['ds'])
        
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def create_forecast(df, periods=90):
    """Create a forecast using Prophet."""
    # Create and fit the model with better parameters for inventory data
    model = Prophet(
        # Parameters compatible with older Prophet versions
        growth='linear',
        seasonality_mode='multiplicative',  # Better for retail sales patterns
        # Adjust changepoint settings to be less flexible with limited data
        changepoint_prior_scale=0.05,
        # Stronger seasonality for retail data
        seasonality_prior_scale=10.0
    )
    
    # Add weekly seasonality explicitly (important for retail)
    model.add_seasonality(name='weekly', period=7, fourier_order=3)
    
    # Fit the model
    model.fit(df)
    
    # Create future dataframe
    future = model.make_future_dataframe(periods=periods)
    
    # Generate forecast
    forecast = model.predict(future)
    
    # Apply floor manually (since the parameter isn't supported)
    forecast['yhat'] = forecast['yhat'].clip(lower=0)
    forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
    forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)
    
    return forecast

def save_forecast_csv(forecast, df, output_path):
    """Save forecast data to CSV file with additional metadata."""
    # Select relevant columns
    forecast_data = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
    
    # Add a column to indicate if this is historical data or forecast
    last_date = df['ds'].max()
    forecast_data['is_forecast'] = forecast_data['ds'] > last_date
    
    # Add the historical data marker
    forecast_data['historical_end'] = forecast_data['ds'] == last_date
    
    # Rename columns for clarity
    forecast_data = forecast_data.rename(columns={
        'ds': 'date',
        'yhat': 'forecast',
        'yhat_lower': 'lower_bound',
        'yhat_upper': 'upper_bound'
    })
    
    # Format date
    forecast_data['date'] = forecast_data['date'].dt.strftime('%Y-%m-%d')
    
    # Save to CSV
    forecast_data.to_csv(output_path, index=False)
    print(f"Forecast data saved to {output_path}")
    
    return forecast_data

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Forecast product sales using Facebook Prophet')
    parser.add_argument('input_file', help='Path to CSV file with date and quantity_sold columns')
    parser.add_argument('--periods', type=int, default=90, help='Number of days to forecast (default: 90)')
    parser.add_argument('--csv', help='Path to save the forecast CSV data (required)')
    
    args = parser.parse_args()
    
    if not args.csv:
        print("Error: --csv parameter is required to specify output file")
        return
    
    # Load data
    df = load_data(args.input_file)
    if df is None:
        return
    
    print(f"Loaded {len(df)} records from {args.input_file}")
    
    # Create forecast
    print(f"Creating forecast for the next {args.periods} days...")
    forecast = create_forecast(df, periods=args.periods)
    
    # Save forecast data to CSV
    save_forecast_csv(forecast, df, args.csv)
    
    # Print summary statistics
    last_date = df['ds'].max()
    print(f"\nForecast Summary:")
    print(f"Last date in historical data: {last_date.strftime('%Y-%m-%d')}")
    
    # Get forecast for next 30, 60, 90 days
    for days in [30, 60, 90]:
        if days <= args.periods:
            future_date = pd.Timestamp(last_date) + pd.Timedelta(days=days)
            future_forecast = forecast[forecast['ds'] >= future_date].iloc[0]
            print(f"Forecast for {days} days ahead ({future_forecast['ds'].strftime('%Y-%m-%d')}): "
                  f"{future_forecast['yhat']:.2f} units (95% CI: {future_forecast['yhat_lower']:.2f} to {future_forecast['yhat_upper']:.2f})")

if __name__ == "__main__":
    main()
