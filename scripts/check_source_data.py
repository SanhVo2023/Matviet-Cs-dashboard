# -*- coding: utf-8 -*-
"""Check source Excel files for cost data."""

import pandas as pd
import sys
sys.stdout.reconfigure(encoding='utf-8')

files = [
    (r"D:\Power Bi\BC bán hàng\SMs ZNS outbounce\extracted\info@matkinh.com.vn_01-03-2025_31-03-2025_DoiSoat_report_0\Report\info@matkinh.com.vn_01-03-2025_31-03-2025_detail.xlsx", "March 2025"),
    (r"D:\Power Bi\BC bán hàng\SMs ZNS outbounce\extracted\info@matkinh.com.vn_01-07-2025_31-07-2025_DoiSoat_report_0\Report\info@matkinh.com.vn_01-07-2025_31-07-2025_detail.xlsx", "July 2025"),
    (r"D:\Power Bi\BC bán hàng\SMs ZNS outbounce\extracted\info@matkinh.com.vn_01-08-2025_31-08-2025_DoiSoat_report_0\Report\info@matkinh.com.vn_01-08-2025_31-08-2025_detail.xlsx", "August 2025"),
]

for file_path, month in files:
    try:
        df = pd.read_excel(file_path, header=6)
        print(f"\n{month}:")
        print(f"  Rows: {len(df)}")

        # Find cost column by checking column index 12 (THANH TIEN)
        cost_col = df.columns[12]  # THANH TIEN is typically column 12
        unit_price_col = df.columns[11]  # DON GIA is column 11

        total_cost = pd.to_numeric(df[cost_col], errors='coerce').fillna(0).sum()
        unit_prices = pd.to_numeric(df[unit_price_col], errors='coerce').fillna(0)
        non_zero_prices = (unit_prices > 0).sum()

        print(f"  Cost column (12): {cost_col}")
        print(f"  Total cost in source: {total_cost:,.0f} VND")
        print(f"  Non-zero unit prices: {non_zero_prices}")
        print(f"  Sample prices: {unit_prices.head(5).tolist()}")
        print(f"  Sample costs: {pd.to_numeric(df[cost_col], errors='coerce').head(5).tolist()}")
    except Exception as e:
        print(f"\n{month}: Error - {e}")
