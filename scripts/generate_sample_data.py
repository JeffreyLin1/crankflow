import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

def generate_bike_shop_data():
    """Generate a full year of realistic bike shop sales data with seasonal patterns."""
    
    # Set up date range for a full year
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2023, 12, 31)
    dates = []
    sales = []
    prices = []
    
    # Define product categories
    products = [
        {"name": "Mountain Bike", "base_price": 799, "price_variance": 100},
        {"name": "Road Bike", "base_price": 1299, "price_variance": 200},
        {"name": "Hybrid Bike", "base_price": 599, "price_variance": 80},
        {"name": "Kids Bike", "base_price": 249, "price_variance": 50},
        {"name": "Electric Bike", "base_price": 1899, "price_variance": 300}
    ]
    
    product_names = []
    
    # Generate daily data
    current_date = start_date
    while current_date <= end_date:
        # For each product, generate sales data
        for product in products:
            dates.append(current_date)
            product_names.append(product["name"])
            
            # Base sales (higher in summer, lower in winter)
            month = current_date.month
            day_of_week = current_date.weekday()
            
            # Seasonal factors
            if 5 <= month <= 8:  # Summer months
                seasonal_factor = random.uniform(0.8, 1.2)
            elif month in [4, 9]:  # Spring/Fall
                seasonal_factor = random.uniform(0.6, 0.9)
            else:  # Winter
                seasonal_factor = random.uniform(0.3, 0.6)
            
            # Day of week factors (weekends are busier)
            if day_of_week >= 5:  # Weekend
                day_factor = random.uniform(1.3, 1.8)
            else:  # Weekday
                day_factor = random.uniform(0.7, 1.2)
            
            # Product-specific factors
            if product["name"] == "Mountain Bike":
                # Mountain bikes sell better in summer
                product_factor = 1.2 if 5 <= month <= 8 else 0.8
            elif product["name"] == "Road Bike":
                # Road bikes peak in spring/summer
                product_factor = 1.3 if 3 <= month <= 7 else 0.7
            elif product["name"] == "Kids Bike":
                # Kids bikes spike before summer and holidays
                product_factor = 1.5 if month in [5, 11, 12] else 0.6
            elif product["name"] == "Electric Bike":
                # E-bikes are trending up all year
                product_factor = 1.0 + (current_date - start_date).days / 365
            else:
                # Hybrid bikes are steady sellers
                product_factor = 1.0
            
            # Calculate base quantity
            base_quantity = 5 * seasonal_factor * day_factor * product_factor
            
            # Add randomness
            noise = random.normalvariate(0, 1)
            final_quantity = max(0, round(base_quantity + noise))
            
            # Generate price with some variation
            price_variation = random.uniform(-1, 1) * product["price_variance"]
            price = product["base_price"] + price_variation
            
            # Special sales events (random discounts a few times a year)
            if random.random() < 0.02:  # 2% chance of a sale
                price = price * random.uniform(0.7, 0.9)  # 10-30% discount
            
            sales.append(final_quantity)
            prices.append(round(price, 2))
        
        current_date += timedelta(days=1)
    
    # Create DataFrame
    df = pd.DataFrame({
        'date': dates,
        'product': product_names,
        'quantity_sold': sales,
        'price': prices
    })
    
    return df

def main():
    # Generate the data
    df = generate_bike_shop_data()
    
    # Create output directory if it doesn't exist
    output_dir = 'sample_data'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Save full dataset
    full_path = os.path.join(output_dir, 'bike_shop_sales_full.csv')
    df.to_csv(full_path, index=False)
    print(f"Full dataset saved to {full_path} with {len(df)} records")
    
    # Create aggregated dataset (total daily sales across all products)
    daily_sales = df.groupby('date')['quantity_sold'].sum().reset_index()
    daily_path = os.path.join(output_dir, 'bike_shop_daily_sales.csv')
    daily_sales.to_csv(daily_path, index=False)
    print(f"Daily sales dataset saved to {daily_path} with {len(daily_sales)} records")
    
    # Create product-specific datasets
    for product in df['product'].unique():
        product_df = df[df['product'] == product]
        product_daily = product_df.groupby('date')['quantity_sold'].sum().reset_index()
        product_path = os.path.join(output_dir, f'{product.lower().replace(" ", "_")}_sales.csv')
        product_daily.to_csv(product_path, index=False)
        print(f"{product} dataset saved to {product_path} with {len(product_daily)} records")

if __name__ == "__main__":
    main() 