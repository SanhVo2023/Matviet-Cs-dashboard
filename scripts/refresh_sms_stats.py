"""
Refresh SMS/ZNS statistics cache
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
    print("Refreshing monthly stats...")

    # Define months we know we have data for
    months = [
        '2025-02-01', '2025-04-01', '2025-05-01', '2025-06-01',
        '2025-09-01', '2025-10-01', '2025-11-01', '2025-12-01', '2026-01-01'
    ]

    # Clear existing cache
    supabase.table('sms_monthly_stats_cache').delete().neq('id', 0).execute()

    for month in months:
        print(f"  Processing {month}...")
        for channel in ['sms', 'zns']:
            # Get count first using a simple count query
            count_result = supabase.table('sms_zns_messages').select(
                '*', count='exact', head=True
            ).eq('report_month', month).eq('channel', channel).execute()

            total_messages = count_result.count or 0
            print(f"    {channel}: counting... {total_messages} messages")

            if total_messages == 0:
                continue

            # Get aggregates in batches
            successful = 0
            total_cost = 0
            phones = set()

            batch_size = 1000
            offset = 0

            while offset < total_messages:
                data = supabase.table('sms_zns_messages').select(
                    'phone, success_count, unit_price, total_mt'
                ).eq('report_month', month).eq('channel', channel).range(offset, offset + batch_size - 1).execute()

                for r in data.data:
                    successful += r.get('success_count', 0) or 0
                    # Calculate cost as unit_price * total_mt
                    unit_price = r.get('unit_price', 0) or 0
                    total_mt = r.get('total_mt', 1) or 1
                    total_cost += unit_price * total_mt
                    if r.get('phone'):
                        phones.add(r['phone'])

                offset += batch_size

            supabase.table('sms_monthly_stats_cache').insert({
                'report_month': month,
                'channel': channel,
                'total_messages': total_messages,
                'successful_messages': successful,
                'unique_recipients': len(phones),
                'total_cost': total_cost
            }).execute()
            print(f"    {channel}: {total_messages} messages, {len(phones)} unique")

def refresh_campaign_stats():
    print("\nRefreshing campaign stats...")

    # Clear existing cache
    supabase.table('sms_campaign_stats_cache').delete().neq('id', 0).execute()

    # Get campaign types
    campaign_types = supabase.table('sms_zns_campaign_types').select('id, name').execute()
    campaign_map = {ct['id']: ct['name'] for ct in campaign_types.data}

    # Define known combos
    combos = [
        (None, 'sms', 'Uncategorized'),
        (None, 'zns', 'Uncategorized'),
    ]
    for ct in campaign_types.data:
        combos.append((ct['id'], 'sms', ct['name']))
        combos.append((ct['id'], 'zns', ct['name']))

    for campaign_id, channel, campaign_name in combos:
        # Get count first
        query = supabase.table('sms_zns_messages').select(
            'id', count='exact', head=True
        ).eq('channel', channel)

        if campaign_id:
            query = query.eq('campaign_type_id', campaign_id)
        else:
            query = query.is_('campaign_type_id', 'null')

        count_result = query.execute()
        total_messages = count_result.count or 0

        if total_messages == 0:
            continue

        print(f"  Processing {campaign_name} - {channel}: {total_messages} messages...")

        # Get aggregates in batches
        successful = 0
        total_cost = 0
        phones = set()

        batch_size = 1000
        offset = 0

        while offset < total_messages:
            query = supabase.table('sms_zns_messages').select(
                'phone, success_count, unit_price, total_mt'
            ).eq('channel', channel)

            if campaign_id:
                query = query.eq('campaign_type_id', campaign_id)
            else:
                query = query.is_('campaign_type_id', 'null')

            data = query.range(offset, offset + batch_size - 1).execute()

            for r in data.data:
                successful += r.get('success_count', 0) or 0
                # Calculate cost as unit_price * total_mt
                unit_price = r.get('unit_price', 0) or 0
                total_mt = r.get('total_mt', 1) or 1
                total_cost += unit_price * total_mt
                if r.get('phone'):
                    phones.add(r['phone'])

            offset += batch_size

        supabase.table('sms_campaign_stats_cache').insert({
            'campaign_name': campaign_name,
            'message_channel': channel,
            'total_messages': total_messages,
            'successful_messages': successful,
            'unique_recipients': len(phones),
            'total_cost': total_cost
        }).execute()

if __name__ == "__main__":
    refresh_monthly_stats()
    refresh_campaign_stats()
    print("\nDone!")
