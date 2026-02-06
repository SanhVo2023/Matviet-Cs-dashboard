"""
Import SMS/ZNS data from extracted ZIP files only
"""

import os
import re
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

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

EXTRACT_DIR = Path(r"D:\Power Bi\BC bán hàng\SMs ZNS outbounce\extracted")

# Campaign type patterns
CAMPAIGN_PATTERNS = {
    'birthday': {
        'patterns': [r'sinh\s*nh[aâ]t', r'birthday', r'sn\d+', r'20%.*sinh\s*nh[aâ]t'],
        'voucher_pattern': r'(SN\d+[A-Z]*)',
    },
    'winback_6m': {'patterns': [r'6\s*th[aá]ng', r'6\s*months?'], 'voucher_pattern': r'([A-Z0-9]{6,})'},
    'winback_9m': {'patterns': [r'9\s*th[aá]ng', r'9\s*months?'], 'voucher_pattern': r'([A-Z0-9]{6,})'},
    'winback_12m': {'patterns': [r'12\s*th[aá]ng', r'12\s*months?', r'1\s*n[aă]m'], 'voucher_pattern': r'([A-Z0-9]{6,})'},
    'winback_18m': {'patterns': [r'18\s*th[aá]ng', r'18\s*months?'], 'voucher_pattern': r'([A-Z0-9]{6,})'},
    'warranty': {'patterns': [r'b[aả]o\s*h[aà]nh', r'warranty', r'x[aá]c\s*nh[aậ]n.*b[aả]o\s*h[aà]nh'], 'voucher_pattern': None},
    'referral': {'patterns': [r'gi[oớ]i\s*thi[eệ]u', r'referral', r'b[aạ]n\s*b[eè]'], 'voucher_pattern': r'([A-Z0-9]{6,})'},
    'welcome': {'patterns': [r'ch[aà]o\s*m[uừ]ng', r'welcome', r'kh[aá]ch\s*h[aà]ng\s*m[oớ]i'], 'voucher_pattern': r'([A-Z0-9]{6,})'},
    'eye_check': {'patterns': [r'kh[aá]m\s*m[aắ]t', r'ki[eể]m\s*tra\s*m[aắ]t', r'eye\s*check', r'l[iị]ch\s*h[eẹ]n'], 'voucher_pattern': None},
    'adhoc_campaign': {'patterns': [r'gi[aả]m\s*gi[aá]', r'khuy[eế]n\s*m[aã]i', r'promotion', r'sale', r'ưu\s*đ[aã]i', r'\d+%\s*off'], 'voucher_pattern': r'([A-Z0-9]{6,})'},
}

campaign_type_cache = {}

def load_campaign_types():
    global campaign_type_cache
    result = supabase.table('sms_zns_campaign_types').select('id, name').execute()
    for row in result.data:
        name_lower = row['name'].lower().replace(' ', '_').replace('-', '_')
        campaign_type_cache[name_lower] = row['id']
        campaign_type_cache[row['name'].lower()] = row['id']
    print(f"Loaded {len(campaign_type_cache)} campaign types")

def normalize_phone(phone):
    if not phone:
        return None
    phone_str = str(phone).replace('.0', '').strip()
    phone_str = re.sub(r'\D', '', phone_str)
    if phone_str.startswith('84') and len(phone_str) > 9:
        phone_str = '0' + phone_str[2:]
    if not phone_str.startswith('0') and len(phone_str) == 9:
        phone_str = '0' + phone_str
    if len(phone_str) != 10:
        return None
    return phone_str

def classify_campaign(content, template_id=None):
    if not content:
        return None, None
    content_lower = content.lower()
    for campaign_key, config in CAMPAIGN_PATTERNS.items():
        for pattern in config['patterns']:
            if re.search(pattern, content_lower, re.IGNORECASE):
                voucher_code = None
                if config.get('voucher_pattern'):
                    match = re.search(config['voucher_pattern'], content, re.IGNORECASE)
                    if match:
                        voucher_code = match.group(1).upper()
                campaign_type_id = campaign_type_cache.get(campaign_key) or campaign_type_cache.get(campaign_key.replace('_', ' '))
                return campaign_type_id, voucher_code
    if re.search(r'\d+%|gi[aả]m|voucher', content_lower):
        return campaign_type_cache.get('adhoc_campaign') or campaign_type_cache.get('adhoc campaign'), None
    return None, None

def determine_channel(message_type):
    if not message_type:
        return 'sms'
    if 'zalo' in str(message_type).lower():
        return 'zns'
    return 'sms'

def parse_date_from_filename(filename):
    match = re.search(r'(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{4})', filename)
    if match:
        start_day, start_month, start_year = match.group(1), match.group(2), match.group(3)
        return datetime(int(start_year), int(start_month), 1).date()
    return None

def read_excel_file(file_path):
    try:
        df = pd.read_excel(file_path, header=6)
        column_mapping = {
            'STT': 'stt', 'Mã tin nhắn': 'message_id', 'Loại tin nhắn': 'message_type',
            'Brandname': 'brandname', 'Thời gian gửi': 'sent_at', 'Nội dung': 'content',
            'Số điện thoại': 'phone', 'Mạng': 'network', 'Tổng số tin MT': 'total_mt',
            'Thành công': 'success_count', 'Thất bại': 'fail_count',
            'ĐƠN GIÁ (VNĐ/MT)': 'unit_price', 'THÀNH TIỀN': 'total_cost',
            'Template Id': 'template_id', 'Tên chiến dịch': 'campaign_name',
        }
        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                df = df.rename(columns={old_col: new_col})
        if 'phone' in df.columns:
            df = df[df['phone'].notna()]
            def is_valid_phone(x):
                if pd.isna(x):
                    return False
                phone_str = str(x).replace('.0', '').strip()
                digits_only = re.sub(r'\D', '', phone_str)
                return len(digits_only) >= 9 and len(digits_only) <= 12
            df = df[df['phone'].apply(is_valid_phone)]
        return df
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def process_dataframe(df, source_file, report_month):
    records = []
    for _, row in df.iterrows():
        try:
            phone_raw = str(row.get('phone', '')).replace('.0', '')
            phone = normalize_phone(phone_raw)
            if not phone:
                continue
            content = str(row.get('content', '')) if pd.notna(row.get('content')) else None
            template_id = str(row.get('template_id', '')) if pd.notna(row.get('template_id')) else None
            campaign_type_id, voucher_code = classify_campaign(content, template_id)
            channel = determine_channel(row.get('message_type'))
            sent_at = None
            if pd.notna(row.get('sent_at')):
                try:
                    if isinstance(row['sent_at'], datetime):
                        sent_at = row['sent_at'].isoformat()
                    else:
                        sent_at = pd.to_datetime(row['sent_at'], dayfirst=True).isoformat()
                except:
                    sent_at = datetime.now().isoformat()
            else:
                sent_at = datetime.now().isoformat()
            record = {
                'message_id': str(row.get('message_id', '')) if pd.notna(row.get('message_id')) else None,
                'message_type': str(row.get('message_type', '')) if pd.notna(row.get('message_type')) else None,
                'brandname': str(row.get('brandname', '')) if pd.notna(row.get('brandname')) else None,
                'channel': channel, 'phone': phone, 'customer_id': None,
                'content': content[:5000] if content else None,
                'template_id': template_id, 'campaign_type_id': campaign_type_id,
                'voucher_code': voucher_code, 'sent_at': sent_at,
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
            continue
    return records

def insert_records(records, batch_size=500):
    total = len(records)
    inserted = 0
    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        try:
            supabase.table('sms_zns_messages').insert(batch).execute()
            inserted += len(batch)
            print(f"  Inserted {inserted}/{total} records")
        except Exception as e:
            print(f"  Error inserting batch: {e}")
            for record in batch:
                try:
                    supabase.table('sms_zns_messages').insert(record).execute()
                    inserted += 1
                except:
                    pass
    return inserted

def main():
    print("=" * 60)
    print("Import Extracted ZIP Files")
    print("=" * 60)

    load_campaign_types()

    # Find detail files in extracted directories
    excel_files = list(EXTRACT_DIR.glob('**/*detail*.xlsx'))
    print(f"Found {len(excel_files)} detail files to process")

    total_records = 0
    for excel_file in excel_files:
        print(f"\nProcessing: {excel_file.name}")
        report_month = parse_date_from_filename(excel_file.name)
        if not report_month:
            print(f"  Could not determine report month, skipping")
            continue
        print(f"  Report month: {report_month}")
        df = read_excel_file(excel_file)
        if df is None or df.empty:
            print(f"  No data found, skipping")
            continue
        print(f"  Found {len(df)} rows")
        records = process_dataframe(df, excel_file.name, report_month)
        print(f"  Prepared {len(records)} valid records")
        if records:
            inserted = insert_records(records)
            total_records += inserted

    print(f"\nTotal records inserted: {total_records}")
    print("=" * 60)

if __name__ == "__main__":
    main()
