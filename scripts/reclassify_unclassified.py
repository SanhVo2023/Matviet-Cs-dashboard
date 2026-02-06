"""
Reclassify unclassified SMS/ZNS messages directly (no offset).
Queries only messages with NULL campaign_type_id.
"""

import os
import re
import time
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Campaign type IDs
CAMPAIGN_TYPES = {
    'birthday': 'dc8c2a2a-8a98-4797-8537-c6a832bfe7b6',
    'otp': 'bdd2ca55-94ce-4a3c-88ad-acbb1c13340e',
    'eye_check': 'c00ffe61-09c9-4a8f-b8f6-e95a6799dd75',
    'receipt': '111b8ea0-ac93-4e69-a24c-719bc5bbb0ab',
    'cash_voucher': '2bccca25-1924-4c4a-8a2f-985ac2741a56',
    'fmv_voucher': '2f68a995-b058-42fb-8647-5d7ee6dc7563',
    'npo_voucher': '0c917a74-efd9-462a-8907-008faf397a9c',
    'warranty': '27017108-fd02-49b9-b0ed-cb75fbc044dd',
    'winback_6m': '497642c6-395f-4a91-a65d-202f79fdd1b9',
    'winback_9m': '18f0bf34-e66e-4e1e-95c6-0ecf2489370d',
    'winback_12m': '4ef02a69-c20d-45d0-8be5-b536013c9e1b',
    'winback_18m': '7d112eac-14e9-48ec-9967-6522fb7927c8',
    'advertising': '8c58c1e6-fd9a-4a21-a628-d7eeea29cbc2',
    'referral': '8f53154c-c9a3-4d71-a667-308902e3cf7e',
    'welcome': 'aa37a7ae-5ce8-4e0b-bde8-867ff527f5b7',
    'other': '557d3b2f-5677-4b34-9339-7661b250021f',
}

def classify_message(content):
    """Classify message based on content analysis."""
    if not content:
        return 'other'

    c = str(content)
    c_lower = c.lower()

    # Birthday: JSON template with SN voucher code
    if c.startswith('[{"Key"') and 'voucher_code' in c and 'SN' in c:
        return 'birthday'

    # OTP: Authentication codes
    if 'ma xac thuc' in c_lower or 'xac thuc cua ban' in c_lower:
        return 'otp'

    # Warranty confirmation
    if 'kich hoat bao hanh' in c_lower or 'xac nhan bao hanh' in c_lower:
        return 'warranty'

    # Cash voucher (Prada, Maui Jim purchases)
    if 'cashvoucher' in c_lower or re.search(r'VC\d+K.*CPM', c):
        return 'cash_voucher'

    # FMV voucher
    if re.search(r'FMV\d+', c):
        return 'fmv_voucher'

    # NPO voucher (NPS feedback)
    if 'NPO' in c and ('voucher' in c_lower or '%' in c):
        return 'npo_voucher'

    # Eye check reminder: JSON with date and name format
    if c.startswith('["') and re.search(r'\d{2}/\d{2}/\d{4}', c):
        return 'eye_check'

    # Receipt/Order confirmation with order code
    if re.search(r'SO\d+-\d+/\d+|BH\d+-\d+/\d+', c) and 'cam on' in c_lower:
        return 'receipt'

    # Win-back campaigns
    if '6 thang' in c_lower or '6 months' in c_lower:
        return 'winback_6m'
    if '9 thang' in c_lower or '9 months' in c_lower:
        return 'winback_9m'
    if '12 thang' in c_lower or '1 nam' in c_lower:
        return 'winback_12m'
    if '18 thang' in c_lower:
        return 'winback_18m'

    # Advertising/Promotion (quang cao, sale, uu dai)
    if 'quang cao' in c_lower or 'khuyen mai' in c_lower:
        return 'advertising'
    if re.search(r'giam.*\d+%', c_lower) or 'uu dai' in c_lower:
        return 'advertising'
    if 'OEB' in c and '%' in c:
        return 'advertising'

    return 'other'


def process_batch():
    """Process a batch of unclassified messages."""
    # Get unclassified messages (limit 200 to avoid timeout)
    for attempt in range(3):
        try:
            time.sleep(1)
            result = supabase.table('sms_zns_messages')\
                .select('id, content')\
                .is_('campaign_type_id', 'null')\
                .limit(200)\
                .execute()
            break
        except Exception as e:
            if attempt < 2:
                print(f"  Retry {attempt + 1}...")
                time.sleep(3)
            else:
                raise

    if not result.data:
        return 0

    # Classify and group updates
    updates_by_type = {}
    for row in result.data:
        campaign = classify_message(row['content'])
        campaign_id = CAMPAIGN_TYPES.get(campaign, CAMPAIGN_TYPES['other'])

        if campaign_id not in updates_by_type:
            updates_by_type[campaign_id] = []
        updates_by_type[campaign_id].append(row['id'])

    # Apply updates
    updated = 0
    for campaign_id, ids in updates_by_type.items():
        chunk_size = 50
        for i in range(0, len(ids), chunk_size):
            chunk = ids[i:i + chunk_size]
            try:
                time.sleep(0.5)
                supabase.table('sms_zns_messages').update({
                    'campaign_type_id': campaign_id
                }).in_('id', chunk).execute()
                updated += len(chunk)
            except Exception as e:
                print(f"  Error: {e}")

    return updated


def main():
    print("=" * 60)
    print("Reclassifying Unclassified Messages")
    print("=" * 60)

    # Get unclassified count
    result = supabase.table('sms_zns_messages').select('id', count='exact', head=True).is_('campaign_type_id', 'null').execute()
    total_unclassified = result.count
    print(f"Unclassified messages: {total_unclassified:,}")

    total_updated = 0
    batch_num = 0

    while True:
        batch_num += 1
        updated = process_batch()

        if updated == 0:
            break

        total_updated += updated
        remaining = total_unclassified - total_updated
        pct = (total_updated / total_unclassified) * 100 if total_unclassified > 0 else 0
        print(f"Batch {batch_num}: +{updated} ({total_updated:,} total, {pct:.1f}%, ~{remaining:,} remaining)")

    print(f"\nTotal reclassified: {total_updated:,}")


if __name__ == "__main__":
    main()
