"""
SMS/ZNS Data Import Script for Mắt Việt CDP
This script imports eSMS monthly reports into Supabase database
"""

import os
import re
import zipfile
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env.local')

# Supabase configuration
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check .env.local file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Data directory
DATA_DIR = Path(r"D:\Power Bi\BC bán hàng\SMs ZNS outbounce")
EXTRACT_DIR = DATA_DIR / "extracted"

# Campaign type patterns for classification
CAMPAIGN_PATTERNS = {
    'birthday': {
        'patterns': [
            r'sinh\s*nh[aâ]t',
            r'birthday',
            r'sn\d+',  # SN followed by numbers (voucher codes)
            r'20%.*sinh\s*nh[aâ]t',
        ],
        'voucher_pattern': r'(SN\d+[A-Z]*)',
    },
    'winback_6m': {
        'patterns': [
            r'6\s*th[aá]ng',
            r'6\s*months?',
        ],
        'voucher_pattern': r'([A-Z0-9]{6,})',
    },
    'winback_9m': {
        'patterns': [
            r'9\s*th[aá]ng',
            r'9\s*months?',
        ],
        'voucher_pattern': r'([A-Z0-9]{6,})',
    },
    'winback_12m': {
        'patterns': [
            r'12\s*th[aá]ng',
            r'12\s*months?',
            r'1\s*n[aă]m',
        ],
        'voucher_pattern': r'([A-Z0-9]{6,})',
    },
    'winback_18m': {
        'patterns': [
            r'18\s*th[aá]ng',
            r'18\s*months?',
        ],
        'voucher_pattern': r'([A-Z0-9]{6,})',
    },
    'warranty': {
        'patterns': [
            r'b[aả]o\s*h[aà]nh',
            r'warranty',
            r'x[aá]c\s*nh[aậ]n.*b[aả]o\s*h[aà]nh',
        ],
        'voucher_pattern': None,
    },
    'referral': {
        'patterns': [
            r'gi[oớ]i\s*thi[eệ]u',
            r'referral',
            r'b[aạ]n\s*b[eè]',
        ],
        'voucher_pattern': r'([A-Z0-9]{6,})',
    },
    'welcome': {
        'patterns': [
            r'ch[aà]o\s*m[uừ]ng',
            r'welcome',
            r'kh[aá]ch\s*h[aà]ng\s*m[oớ]i',
        ],
        'voucher_pattern': r'([A-Z0-9]{6,})',
    },
    'eye_check': {
        'patterns': [
            r'kh[aá]m\s*m[aắ]t',
            r'ki[eể]m\s*tra\s*m[aắ]t',
            r'eye\s*check',
            r'l[iị]ch\s*h[eẹ]n',
        ],
        'voucher_pattern': None,
    },
    'adhoc_campaign': {
        'patterns': [
            r'gi[aả]m\s*gi[aá]',
            r'khuy[eế]n\s*m[aã]i',
            r'promotion',
            r'sale',
            r'ưu\s*đ[aã]i',
            r'\d+%\s*off',
        ],
        'voucher_pattern': r'([A-Z0-9]{6,})',
    },
}

# Cache for campaign type IDs
campaign_type_cache = {}

# Cache for customer phone mapping
customer_phone_cache = {}


def load_campaign_types():
    """Load campaign type IDs from database"""
    global campaign_type_cache
    result = supabase.table('sms_zns_campaign_types').select('id, name').execute()
    for row in result.data:
        # Map our pattern keys to database names
        name_lower = row['name'].lower().replace(' ', '_').replace('-', '_')
        campaign_type_cache[name_lower] = row['id']
        # Also map exact name
        campaign_type_cache[row['name'].lower()] = row['id']
    print(f"Loaded {len(campaign_type_cache)} campaign types")


def load_customer_phones():
    """Load customer phone numbers for matching"""
    global customer_phone_cache
    print("Loading customer phone numbers...")

    try:
        # Fetch customers in batches
        offset = 0
        batch_size = 1000

        while True:
            result = supabase.table('customers').select('id, phone').range(offset, offset + batch_size - 1).execute()
            if not result.data:
                break

            for row in result.data:
                if row.get('phone'):
                    # Normalize phone number (remove spaces, +84 -> 0)
                    phone = normalize_phone(row['phone'])
                    if phone:
                        customer_phone_cache[phone] = row['id']

            offset += batch_size
            if len(result.data) < batch_size:
                break
    except Exception as e:
        print(f"Warning: Could not load customer phones: {e}")

    print(f"Loaded {len(customer_phone_cache)} customer phone numbers")
    if len(customer_phone_cache) == 0:
        print("Note: Customer matching will be skipped (no phone data in customers table)")


def normalize_phone(phone):
    """Normalize phone number to standard format"""
    if not phone:
        return None

    # Convert to string and remove decimal point if present (Excel number format)
    phone_str = str(phone).replace('.0', '').strip()

    # Remove all non-digits
    phone_str = re.sub(r'\D', '', phone_str)

    # Handle +84 or 84 prefix
    if phone_str.startswith('84') and len(phone_str) > 9:
        phone_str = '0' + phone_str[2:]

    # Ensure it starts with 0
    if not phone_str.startswith('0') and len(phone_str) == 9:
        phone_str = '0' + phone_str

    # Validate length (Vietnamese mobile numbers - 10 digits)
    if len(phone_str) != 10:
        return None

    return phone_str


def classify_campaign(content, template_id=None):
    """Classify message into campaign type based on content and template"""
    if not content:
        return None, None

    content_lower = content.lower()

    # Check each campaign type's patterns
    for campaign_key, config in CAMPAIGN_PATTERNS.items():
        for pattern in config['patterns']:
            if re.search(pattern, content_lower, re.IGNORECASE):
                # Try to extract voucher code
                voucher_code = None
                if config.get('voucher_pattern'):
                    match = re.search(config['voucher_pattern'], content, re.IGNORECASE)
                    if match:
                        voucher_code = match.group(1).upper()

                # Map to database campaign type
                campaign_type_id = None
                if campaign_key in campaign_type_cache:
                    campaign_type_id = campaign_type_cache[campaign_key]
                elif campaign_key.replace('_', ' ') in campaign_type_cache:
                    campaign_type_id = campaign_type_cache[campaign_key.replace('_', ' ')]

                return campaign_type_id, voucher_code

    # Default to adhoc if has discount mention but no specific match
    if re.search(r'\d+%|gi[aả]m|voucher', content_lower):
        return campaign_type_cache.get('adhoc_campaign') or campaign_type_cache.get('adhoc campaign'), None

    return None, None


def determine_channel(message_type):
    """Determine if message is SMS or ZNS based on message type"""
    if not message_type:
        return 'sms'

    msg_type_lower = str(message_type).lower()

    if 'zalo' in msg_type_lower:
        return 'zns'

    return 'sms'


def extract_zip_files():
    """Extract all ZIP files in the data directory"""
    EXTRACT_DIR.mkdir(exist_ok=True)

    zip_files = list(DATA_DIR.glob('*.zip'))
    print(f"Found {len(zip_files)} ZIP files to extract")

    for zip_path in zip_files:
        print(f"Extracting: {zip_path.name}")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Extract to a subfolder named after the zip file
                extract_subdir = EXTRACT_DIR / zip_path.stem
                extract_subdir.mkdir(exist_ok=True)
                zip_ref.extractall(extract_subdir)
                print(f"  Extracted to: {extract_subdir}")
        except Exception as e:
            print(f"  Error extracting {zip_path.name}: {e}")


def parse_date_from_filename(filename):
    """Extract date range from filename"""
    # Pattern: info@xxx_DD-MM-YYYY_DD-MM-YYYY_...
    match = re.search(r'(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{4})', filename)
    if match:
        start_day, start_month, start_year = match.group(1), match.group(2), match.group(3)
        end_day, end_month, end_year = match.group(4), match.group(5), match.group(6)

        # Return first day of the month for report_month
        return datetime(int(start_year), int(start_month), 1).date()

    return None


def read_excel_file(file_path):
    """Read Excel file with header at row 6"""
    try:
        # Read with header at row 6 (0-indexed = 6, because row 6 has the actual headers)
        df = pd.read_excel(file_path, header=6)

        # Rename columns to English
        column_mapping = {
            'STT': 'stt',
            'Mã tin nhắn': 'message_id',
            'Loại tin nhắn': 'message_type',
            'Brandname': 'brandname',
            'Thời gian gửi': 'sent_at',
            'Nội dung': 'content',
            'Số điện thoại': 'phone',
            'Mạng': 'network',
            'Tổng số tin MT': 'total_mt',
            'Thành công': 'success_count',
            'Thất bại': 'fail_count',
            'ĐƠN GIÁ (VNĐ/MT)': 'unit_price',
            'THÀNH TIỀN': 'total_cost',
            'Template Id': 'template_id',
            'Tên chiến dịch': 'campaign_name',
        }

        # Try to rename columns (some files might have slight variations)
        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                df = df.rename(columns={old_col: new_col})

        # Filter out rows that are not actual data (e.g., summary rows)
        if 'phone' in df.columns:
            df = df[df['phone'].notna()]
            # Check if phone looks like a valid number (integer or string of digits)
            def is_valid_phone(x):
                if pd.isna(x):
                    return False
                phone_str = str(x).replace('.0', '').strip()
                # Check if it's mostly digits (allow some formatting)
                digits_only = re.sub(r'\D', '', phone_str)
                return len(digits_only) >= 9 and len(digits_only) <= 12
            df = df[df['phone'].apply(is_valid_phone)]

        return df

    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None


def process_dataframe(df, source_file, report_month):
    """Process DataFrame and prepare records for insertion"""
    records = []

    for _, row in df.iterrows():
        try:
            # Normalize phone number
            phone_raw = str(row.get('phone', '')).replace('.0', '')
            phone = normalize_phone(phone_raw)

            if not phone:
                continue

            # Get content
            content = str(row.get('content', '')) if pd.notna(row.get('content')) else None
            template_id = str(row.get('template_id', '')) if pd.notna(row.get('template_id')) else None

            # Classify campaign
            campaign_type_id, voucher_code = classify_campaign(content, template_id)

            # Determine channel
            channel = determine_channel(row.get('message_type'))

            # Parse sent_at
            sent_at = None
            if pd.notna(row.get('sent_at')):
                try:
                    if isinstance(row['sent_at'], datetime):
                        sent_at = row['sent_at'].isoformat()
                    else:
                        sent_at = pd.to_datetime(row['sent_at']).isoformat()
                except:
                    sent_at = datetime.now().isoformat()
            else:
                sent_at = datetime.now().isoformat()

            # Get customer_id from phone cache
            customer_id = customer_phone_cache.get(phone)

            record = {
                'message_id': str(row.get('message_id', '')) if pd.notna(row.get('message_id')) else None,
                'message_type': str(row.get('message_type', '')) if pd.notna(row.get('message_type')) else None,
                'brandname': str(row.get('brandname', '')) if pd.notna(row.get('brandname')) else None,
                'channel': channel,
                'phone': phone,
                'customer_id': customer_id,
                'content': content[:5000] if content else None,  # Limit content length
                'template_id': template_id,
                'campaign_type_id': campaign_type_id,
                'voucher_code': voucher_code,
                'sent_at': sent_at,
                'network': str(row.get('network', '')) if pd.notna(row.get('network')) else None,
                'total_mt': int(row.get('total_mt', 1)) if pd.notna(row.get('total_mt')) else 1,
                'success_count': int(row.get('success_count', 0)) if pd.notna(row.get('success_count')) else 0,
                'fail_count': int(row.get('fail_count', 0)) if pd.notna(row.get('fail_count')) else 0,
                'unit_price': float(row.get('unit_price', 0)) if pd.notna(row.get('unit_price')) else 0,
                'total_cost': float(row.get('total_cost', 0)) if pd.notna(row.get('total_cost')) else 0,
                'report_month': report_month.isoformat() if report_month else None,
                'source_file': source_file,
            }

            records.append(record)

        except Exception as e:
            print(f"Error processing row: {e}")
            continue

    return records


def insert_records(records, batch_size=500):
    """Insert records into database in batches"""
    total = len(records)
    inserted = 0

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        try:
            result = supabase.table('sms_zns_messages').insert(batch).execute()
            inserted += len(batch)
            print(f"  Inserted {inserted}/{total} records")
        except Exception as e:
            print(f"  Error inserting batch: {e}")
            # Try inserting one by one to identify problematic records
            for record in batch:
                try:
                    supabase.table('sms_zns_messages').insert(record).execute()
                    inserted += 1
                except Exception as e2:
                    print(f"    Failed to insert record: {e2}")

    return inserted


def calculate_monthly_stats():
    """Calculate and update monthly statistics"""
    print("\nCalculating monthly statistics...")
    print("Note: Monthly stats will be calculated via SQL migration instead")
    # Stats calculation moved to SQL for better performance


def main():
    """Main import function"""
    print("=" * 60)
    print("SMS/ZNS Data Import Script")
    print("=" * 60)

    # Step 1: Load reference data
    print("\n[1/5] Loading reference data...")
    load_campaign_types()
    load_customer_phones()

    # Step 2: Extract ZIP files
    print("\n[2/5] Extracting ZIP files...")
    extract_zip_files()

    # Step 3: Find all Excel files
    print("\n[3/5] Finding Excel files...")
    excel_files = list(DATA_DIR.glob('*.xlsx'))

    # Also check extracted directories (including nested Report folders)
    if EXTRACT_DIR.exists():
        # Recursively find all xlsx files
        excel_files.extend(EXTRACT_DIR.glob('**/*.xlsx'))

    # Filter to only include detail files (not summary files)
    excel_files = [f for f in excel_files if 'summary' not in f.name.lower() and 'sumary' not in f.name.lower()]

    print(f"Found {len(excel_files)} Excel files to process")

    # Step 4: Process each file
    print("\n[4/5] Processing files...")
    total_records = 0

    for excel_file in excel_files:
        print(f"\nProcessing: {excel_file.name}")

        # Parse report month from filename
        report_month = parse_date_from_filename(excel_file.name)
        if not report_month:
            print(f"  Could not determine report month, skipping")
            continue

        print(f"  Report month: {report_month}")

        # Read Excel file
        df = read_excel_file(excel_file)
        if df is None or df.empty:
            print(f"  No data found, skipping")
            continue

        print(f"  Found {len(df)} rows")

        # Process data
        records = process_dataframe(df, excel_file.name, report_month)
        print(f"  Prepared {len(records)} valid records")

        # Insert records
        if records:
            inserted = insert_records(records)
            total_records += inserted

    print(f"\n[5/5] Total records inserted: {total_records}")

    # Step 5: Calculate monthly stats
    calculate_monthly_stats()

    print("\n" + "=" * 60)
    print("Import completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
