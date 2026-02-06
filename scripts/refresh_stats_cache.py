"""
Refresh SMS/ZNS stats cache tables
"""
import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def refresh_monthly_stats():
    """Refresh monthly stats cache by month"""
    print("Refreshing monthly stats...")

    # Get all months using RPC to avoid timeout
    months = [
        '2025-02-01', '2025-03-01', '2025-04-01', '2025-05-01', '2025-06-01',
        '2025-07-01', '2025-08-01', '2025-09-01', '2025-10-01', '2025-11-01',
        '2025-12-01', '2026-01-01'
    ]

    print(f"Found {len(months)} months to process")

    # Clear existing cache
    supabase.table('sms_monthly_stats_cache').delete().neq('id', 0).execute()

    for month in months:
        print(f"  Processing {month}...")
        for channel in ['sms', 'zns']:
            # Get stats for this month/channel using pagination
            all_data = []
            offset = 0
            batch_size = 1000

            while True:
                result = supabase.table('sms_zns_messages')\
                    .select('id, phone, success_count, total_cost')\
                    .eq('report_month', month)\
                    .eq('channel', channel)\
                    .range(offset, offset + batch_size - 1)\
                    .execute()

                if not result.data:
                    break

                all_data.extend(result.data)
                offset += batch_size

                if len(result.data) < batch_size:
                    break

            if not all_data:
                continue

            total_messages = len(all_data)
            successful_messages = sum(r.get('success_count', 0) or 0 for r in all_data)
            unique_recipients = len(set(r['phone'] for r in all_data if r.get('phone')))
            total_cost = sum(float(r.get('total_cost', 0) or 0) for r in all_data)

            # Insert into cache
            supabase.table('sms_monthly_stats_cache').insert({
                'report_month': month,
                'channel': channel,
                'total_messages': total_messages,
                'successful_messages': successful_messages,
                'unique_recipients': unique_recipients,
                'total_cost': total_cost
            }).execute()

            print(f"    {channel}: {total_messages:,} messages, {unique_recipients:,} unique")


def show_campaign_distribution():
    """Show current campaign distribution"""
    print("\n" + "=" * 60)
    print("Campaign Distribution:")
    print("=" * 60)

    result = supabase.rpc('get_campaign_distribution').execute()

    sales_total = 0
    none_total = 0

    for row in result.data:
        intent_marker = "[SALES]" if row['conversion_intent'] == 'sales' else "[INFO]"
        print(f"  {intent_marker} {row['name']}: {row['count']:,}")
        if row['conversion_intent'] == 'sales':
            sales_total += row['count']
        else:
            none_total += row['count']

    print(f"\n  Sales Intent Total: {sales_total:,}")
    print(f"  Non-Sales Total: {none_total:,}")


if __name__ == "__main__":
    refresh_monthly_stats()
    show_campaign_distribution()
    print("\nDone!")
