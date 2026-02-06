"""
Link SMS/ZNS messages to customers via phone number.
This enables revenue attribution for all months.
"""

import os
import time
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_customer_phone_map():
    """Build a map of phone -> customer_id."""
    print("Loading customer phone map...")
    phone_map = {}
    offset = 0
    batch_size = 1000

    while True:
        result = supabase.table('customers')\
            .select('id, phone')\
            .not_.is_('phone', 'null')\
            .range(offset, offset + batch_size - 1)\
            .execute()

        if not result.data:
            break

        for row in result.data:
            if row['phone']:
                phone_map[row['phone']] = row['id']

        offset += batch_size
        if len(result.data) < batch_size:
            break

    print(f"  Loaded {len(phone_map):,} customer phones")
    return phone_map


def link_messages_for_month(month, phone_map):
    """Link messages to customers for a specific month."""
    print(f"\nProcessing {month}...")

    # Get unlinked messages for this month
    batch_size = 300
    total_updated = 0
    batch_num = 0

    while True:
        batch_num += 1
        time.sleep(1)  # Rate limiting

        try:
            result = supabase.table('sms_zns_messages')\
                .select('id, phone')\
                .eq('report_month', month)\
                .is_('customer_id', 'null')\
                .limit(batch_size)\
                .execute()
        except Exception as e:
            print(f"  Error fetching: {e}")
            time.sleep(3)
            continue

        if not result.data:
            break

        # Group by customer_id for batch updates
        updates_by_customer = {}
        for row in result.data:
            phone = row['phone']
            if phone and phone in phone_map:
                cust_id = phone_map[phone]
                if cust_id not in updates_by_customer:
                    updates_by_customer[cust_id] = []
                updates_by_customer[cust_id].append(row['id'])

        # Batch update by customer_id
        for cust_id, ids in updates_by_customer.items():
            chunk_size = 30
            for i in range(0, len(ids), chunk_size):
                chunk = ids[i:i + chunk_size]
                try:
                    supabase.table('sms_zns_messages')\
                        .update({'customer_id': cust_id})\
                        .in_('id', chunk)\
                        .execute()
                    total_updated += len(chunk)
                except Exception as e:
                    print(f"  Error updating batch: {e}")
                time.sleep(0.3)

        print(f"  Batch {batch_num}: +{len(result.data)}, linked: {total_updated:,}")

    return total_updated


def main():
    print("=" * 60)
    print("Linking SMS/ZNS Messages to Customers")
    print("=" * 60)

    # Build phone map
    phone_map = get_customer_phone_map()

    # Process each month
    months = [
        '2025-05-01', '2025-06-01', '2025-07-01', '2025-08-01',
        '2025-09-01', '2025-10-01', '2025-11-01', '2025-12-01',
        '2026-01-01'
    ]

    total_linked = 0
    for month in months:
        linked = link_messages_for_month(month, phone_map)
        total_linked += linked
        print(f"  {month}: {linked:,} messages linked")

    print(f"\n{'=' * 60}")
    print(f"Total linked: {total_linked:,}")


if __name__ == "__main__":
    main()
