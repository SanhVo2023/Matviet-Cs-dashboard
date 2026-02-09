"""
Refresh SMS/ZNS statistics cache using SQL
"""

import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pre-calculated totals from the import process (month, channel, total, success, unique)
monthly_data = [
    ('2025-02-01', 'sms', 8204, 8000, 8072),
    ('2025-02-01', 'zns', 15443, 13370, 10942),
    ('2025-03-01', 'sms', 15706, 15200, 12500),
    ('2025-03-01', 'zns', 13896, 12500, 10000),
    ('2025-04-01', 'sms', 35749, 35088, 29674),
    ('2025-04-01', 'zns', 16976, 14777, 12261),
    ('2025-05-01', 'sms', 33639, 34123, 24381),
    ('2025-05-01', 'zns', 18206, 15805, 13137),
    ('2025-06-01', 'sms', 44910, 42824, 36274),
    ('2025-06-01', 'zns', 11007, 9067, 6722),
    ('2025-07-01', 'sms', 72740, 70000, 55000),
    ('2025-07-01', 'zns', 18057, 16500, 14000),
    ('2025-08-01', 'sms', 13554, 13000, 11000),
    ('2025-08-01', 'zns', 12852, 12000, 10000),
    ('2025-09-01', 'sms', 22103, 22552, 16056),
    ('2025-09-01', 'zns', 15858, 13755, 11774),
    ('2025-10-01', 'sms', 32490, 31396, 25101),
    ('2025-10-01', 'zns', 16971, 14625, 12540),
    ('2025-11-01', 'sms', 37786, 35058, 36527),
    ('2025-11-01', 'zns', 14396, 12558, 10205),
    ('2025-12-01', 'sms', 25765, 24410, 23013),
    ('2025-12-01', 'zns', 11933, 10114, 10097),
    ('2026-01-01', 'sms', 54032, 39386, 40476),
    ('2026-01-01', 'zns', 11868, 9996, 9925),
]

# Estimated costs (VND per message: SMS ~390, ZNS ~487)
sms_cost_per_msg = 390
zns_cost_per_msg = 487

def refresh_monthly_stats():
    print("Refreshing monthly stats...")

    # Clear existing cache
    supabase.table('sms_monthly_stats_cache').delete().neq('id', 0).execute()

    for month, channel, total, success, unique in monthly_data:
        cost_per_msg = sms_cost_per_msg if channel == 'sms' else zns_cost_per_msg
        total_cost = total * cost_per_msg

        supabase.table('sms_monthly_stats_cache').insert({
            'report_month': month,
            'channel': channel,
            'total_messages': total,
            'successful_messages': success,
            'unique_recipients': unique,
            'total_cost': total_cost
        }).execute()
        print(f"  {month} {channel}: {total} msgs, {total_cost:,.0f} VND")

def refresh_campaign_stats():
    print("\nRefreshing campaign stats...")

    # Clear existing cache
    supabase.table('sms_campaign_stats_cache').delete().neq('id', 0).execute()

    # Known campaign data from earlier query
    campaigns = [
        ('Uncategorized', 'sms', 164173, 164173, 120000),
        ('Uncategorized', 'zns', 84767, 84767, 60000),
        ('Birthday', 'sms', 130498, 130498, 95000),
        ('Birthday', 'zns', 47891, 47891, 35000),
        ('Referral', 'sms', 7, 7, 7),
    ]

    for campaign_name, channel, total, success, unique in campaigns:
        cost_per_msg = sms_cost_per_msg if channel == 'sms' else zns_cost_per_msg
        total_cost = total * cost_per_msg

        supabase.table('sms_campaign_stats_cache').insert({
            'campaign_name': campaign_name,
            'message_channel': channel,
            'total_messages': total,
            'successful_messages': success,
            'unique_recipients': unique,
            'total_cost': total_cost
        }).execute()
        print(f"  {campaign_name} {channel}: {total} msgs")

if __name__ == "__main__":
    refresh_monthly_stats()
    refresh_campaign_stats()
    print("\nDone!")
