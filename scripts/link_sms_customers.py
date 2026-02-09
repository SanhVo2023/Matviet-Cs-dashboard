"""
Link SMS/ZNS messages to customers via phone number matching
"""

import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def build_phone_mapping():
    """Build phone -> customer_id mapping"""
    print("Building phone to customer mapping...")

    phone_to_customer = {}
    offset = 0
    batch_size = 1000

    while True:
        result = supabase.table('customers').select('id, phone').not_.is_('phone', 'null').range(offset, offset + batch_size - 1).execute()

        if not result.data:
            break

        for row in result.data:
            if row['phone']:
                phone_to_customer[row['phone']] = row['id']

        offset += batch_size
        print(f"  Loaded {len(phone_to_customer)} customers...")

        if len(result.data) < batch_size:
            break

    print(f"Total customers with phones: {len(phone_to_customer)}")
    return phone_to_customer

def update_sms_customer_ids(phone_to_customer):
    """Update customer_id in SMS messages"""
    print("\nUpdating SMS messages with customer IDs...")

    months = [
        '2025-02-01', '2025-03-01', '2025-04-01', '2025-05-01', '2025-06-01',
        '2025-07-01', '2025-08-01', '2025-09-01', '2025-10-01', '2025-11-01',
        '2025-12-01', '2026-01-01'
    ]

    total_updated = 0

    for month in months:
        print(f"\nProcessing {month}...")

        # Get messages without customer_id for this month
        offset = 0
        batch_size = 500
        month_updated = 0

        while True:
            result = supabase.table('sms_zns_messages').select('id, phone').eq('report_month', month).is_('customer_id', 'null').range(offset, offset + batch_size - 1).execute()

            if not result.data:
                break

            updates = []
            for row in result.data:
                customer_id = phone_to_customer.get(row['phone'])
                if customer_id:
                    updates.append({'id': row['id'], 'customer_id': customer_id})

            # Batch update
            for upd in updates:
                try:
                    supabase.table('sms_zns_messages').update({'customer_id': upd['customer_id']}).eq('id', upd['id']).execute()
                    month_updated += 1
                except Exception as e:
                    pass

            offset += batch_size
            print(f"  Processed {offset} messages, updated {month_updated}...", end='\r')

            if len(result.data) < batch_size:
                break

        print(f"  {month}: Updated {month_updated} messages")
        total_updated += month_updated

    print(f"\nTotal updated: {total_updated}")
    return total_updated

if __name__ == "__main__":
    phone_map = build_phone_mapping()
    update_sms_customer_ids(phone_map)
    print("\nDone!")
