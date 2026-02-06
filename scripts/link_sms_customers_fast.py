"""
Fast bulk link SMS/ZNS messages to customers via SQL
"""

import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def link_by_month(month):
    """Link SMS messages to customers for a specific month using SQL"""
    print(f"Processing {month}...")

    # Use RPC to execute raw SQL for faster bulk update
    # We'll do it in smaller batches to avoid timeout
    sql = f"""
    UPDATE sms_zns_messages m
    SET customer_id = c.id
    FROM customers c
    WHERE m.phone = c.phone
      AND m.customer_id IS NULL
      AND m.report_month = '{month}'
    """

    try:
        result = supabase.rpc('exec_sql', {'query': sql}).execute()
        print(f"  {month}: Done")
        return True
    except Exception as e:
        print(f"  {month}: Error - {e}")
        return False

def link_via_temp_table():
    """Alternative: Create a mapping and update in bulk"""
    print("Building phone mapping...")

    # Get all customer phones
    phones = {}
    offset = 0
    batch_size = 5000

    while True:
        result = supabase.table('customers').select('id, phone').not_.is_('phone', 'null').range(offset, offset + batch_size - 1).execute()
        if not result.data:
            break
        for r in result.data:
            phones[r['phone']] = r['id']
        offset += batch_size
        if len(result.data) < batch_size:
            break

    print(f"Loaded {len(phones)} customer phones")

    # Process SMS messages in chunks
    months = [
        '2025-02-01', '2025-03-01', '2025-04-01', '2025-05-01', '2025-06-01',
        '2025-07-01', '2025-08-01', '2025-09-01', '2025-10-01', '2025-11-01',
        '2025-12-01', '2026-01-01'
    ]

    total_updated = 0

    for month in months:
        print(f"\nProcessing {month}...")

        # Get messages needing update
        offset = 0
        batch_size = 1000
        month_updated = 0

        while True:
            result = supabase.table('sms_zns_messages').select('id, phone').eq('report_month', month).is_('customer_id', 'null').range(offset, offset + batch_size - 1).execute()

            if not result.data:
                break

            # Build batch updates
            updates = []
            for row in result.data:
                customer_id = phones.get(row['phone'])
                if customer_id:
                    updates.append({'id': row['id'], 'customer_id': customer_id})

            # Batch upsert
            if updates:
                try:
                    supabase.table('sms_zns_messages').upsert(updates, on_conflict='id').execute()
                    month_updated += len(updates)
                except Exception as e:
                    print(f"  Error: {e}")

            offset += batch_size
            print(f"  Processed {offset}, updated {month_updated}...", end='\r')

            if len(result.data) < batch_size:
                break

        print(f"  {month}: Updated {month_updated} messages")
        total_updated += month_updated

    return total_updated

if __name__ == "__main__":
    total = link_via_temp_table()
    print(f"\nTotal updated: {total}")

    # Check final count
    result = supabase.table('sms_zns_messages').select('id', count='exact', head=True).not_.is_('customer_id', 'null').execute()
    print(f"Messages with customer_id: {result.count}")
