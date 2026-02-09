/**
 * Auto Import Script for Mắt Việt Dashboard
 * ===========================================
 *
 * Watches for new files and automatically imports to Supabase.
 *
 * DROP FILES HERE:
 *   - data-import/sms/     → eSMS report files (Excel from info@matkinh.com.vn)
 *   - data-import/orders/  → Sales data (Excel with Báo cáo bán hàng format)
 *
 * Run: npm run import
 */

const chokidar = require('chokidar');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_DIR = path.join(__dirname, '..', 'data-import');
const SMS_DIR = path.join(BASE_DIR, 'sms');
const ORDERS_DIR = path.join(BASE_DIR, 'orders');
const PROCESSED_DIR = path.join(BASE_DIR, 'processed');

// Ensure directories exist
[SMS_DIR, ORDERS_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('');
console.log('🚀 Mắt Việt Auto Import Started');
console.log('━'.repeat(60));
console.log('📁 SMS/ZNS files (eSMS):  data-import/sms/');
console.log('📁 Order files:           data-import/orders/');
console.log('━'.repeat(60));

/**
 * Normalize phone number
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('84')) p = '0' + p.slice(2);
  if (!p.startsWith('0') && p.length === 9) p = '0' + p;
  return p.length >= 10 ? p : null;
}

/**
 * Parse Vietnamese date format (DD/MM/YYYY HH:mm)
 */
function parseVietnameseDate(value) {
  if (!value) return null;

  // Handle Excel serial number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
  }

  // Handle string like "01/01/2026 10:59"
  const str = String(value).trim();
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2})?:?(\d{1,2})?/);
  if (match) {
    const [, day, month, year, hour = 0, min = 0] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
  }

  // Try standard parsing
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Get first day of month for report_month
 */
function getReportMonth(date) {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Parse eSMS Excel file format
 * Headers are at row 6 (index 6), data starts at row 7
 */
function parseEsmsFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find header row (contains "STT" and "Số điện thoại")
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(20, allRows.length); i++) {
    const row = allRows[i];
    if (row && row.includes('STT') && row.some(c => String(c).includes('điện thoại'))) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    console.log('   ⚠️  Could not find eSMS header row');
    return [];
  }

  const headers = allRows[headerRowIdx];
  console.log(`   Found headers at row ${headerRowIdx + 1}`);

  // Map column indices
  const colMap = {};
  headers.forEach((h, idx) => {
    const header = String(h || '').toLowerCase();
    if (header.includes('điện thoại')) colMap.phone = idx;
    if (header.includes('loại tin')) colMap.messageType = idx;
    if (header.includes('brandname')) colMap.brandname = idx;
    if (header.includes('thời gian gửi')) colMap.sentAt = idx;
    if (header.includes('nội dung')) colMap.content = idx;
    if (header.includes('mạng')) colMap.network = idx;
    if (header.includes('tổng số tin mt')) colMap.totalMt = idx;
    if (header.includes('thành công')) colMap.success = idx;
    if (header.includes('thất bại')) colMap.fail = idx;
    if (header.includes('đơn giá')) colMap.unitPrice = idx;
    if (header.includes('thành tiền')) colMap.totalCost = idx;
    if (header.includes('template id')) colMap.templateId = idx;
    if (header.includes('mã tin nhắn')) colMap.messageId = idx;
  });

  // Parse data rows
  const messages = [];
  for (let i = headerRowIdx + 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row || !row[colMap.phone]) continue;

    const phone = normalizePhone(row[colMap.phone]);
    if (!phone) continue;

    const sentAt = parseVietnameseDate(row[colMap.sentAt]);
    if (!sentAt) continue;

    const messageType = String(row[colMap.messageType] || '').toLowerCase();
    const templateId = row[colMap.templateId];

    // Determine channel: ZNS if has template_id or message type contains 'zns'
    const isZns = templateId || messageType.includes('zns');

    messages.push({
      message_id: row[colMap.messageId] ? String(row[colMap.messageId]) : null,
      message_type: row[colMap.messageType] || null,
      brandname: row[colMap.brandname] || null,
      channel: isZns ? 'zns' : 'sms',
      phone: phone,
      content: row[colMap.content] || null,
      template_id: templateId || null,
      sent_at: sentAt.toISOString(),
      network: row[colMap.network] || null,
      total_mt: parseInt(row[colMap.totalMt]) || 1,
      success_count: parseInt(row[colMap.success]) || 0,
      fail_count: parseInt(row[colMap.fail]) || 0,
      unit_price: parseFloat(row[colMap.unitPrice]) || 0,
      total_cost: parseFloat(row[colMap.totalCost]) || parseFloat(row[colMap.unitPrice]) || 0,
      report_month: getReportMonth(sentAt),
      source_file: path.basename(filePath),
    });
  }

  return messages;
}

/**
 * Import SMS/ZNS messages from eSMS file
 */
async function importSmsData(filePath) {
  console.log('\n📨 Processing eSMS file:', path.basename(filePath));

  const messages = parseEsmsFile(filePath);
  console.log(`   Valid messages: ${messages.length}`);

  if (messages.length === 0) {
    console.log('   ⚠️  No valid messages found');
    return 0;
  }

  // Get phone-customer mapping
  console.log('   Loading customer mappings...');
  const { data: phoneMap } = await supabase.from('phone_customer_map').select('phone, customer_id');
  const customerByPhone = {};
  phoneMap?.forEach(p => { customerByPhone[p.phone] = p.customer_id; });
  console.log(`   Found ${Object.keys(customerByPhone).length} phone mappings`);

  // Get campaign type mappings
  const { data: patterns } = await supabase
    .from('sms_pattern_campaign_map')
    .select('pattern, campaign_type_id')
    .order('priority', { ascending: false });

  const { data: templates } = await supabase
    .from('sms_template_campaign_map')
    .select('template_id, campaign_type_id');

  const templateMap = {};
  templates?.forEach(t => { templateMap[t.template_id] = t.campaign_type_id; });

  // Enrich messages
  const enrichedMessages = messages.map(m => {
    // Link customer
    m.customer_id = customerByPhone[m.phone] || null;

    // Classify campaign
    if (m.template_id && templateMap[m.template_id]) {
      m.campaign_type_id = templateMap[m.template_id];
    } else if (m.content && patterns) {
      for (const p of patterns) {
        if (m.content.toLowerCase().includes(p.pattern.toLowerCase())) {
          m.campaign_type_id = p.campaign_type_id;
          break;
        }
      }
    }

    return m;
  });

  // Insert in batches
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < enrichedMessages.length; i += BATCH_SIZE) {
    const batch = enrichedMessages.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('sms_zns_messages').insert(batch);

    if (error) {
      console.error(`   ❌ Batch error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`   ✅ Inserted ${inserted}/${enrichedMessages.length}`);
    }
  }

  return inserted;
}

/**
 * Parse Orders Excel file (Báo cáo bán hàng format)
 */
function parseOrdersFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find header row
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(20, allRows.length); i++) {
    const row = allRows[i];
    if (row && row.some(c => String(c).includes('Số CT') || String(c).includes('Mã KH'))) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    console.log('   ⚠️  Could not find order header row');
    return [];
  }

  const headers = allRows[headerRowIdx];
  console.log(`   Found headers at row ${headerRowIdx + 1}`);

  // Map columns
  const colMap = {};
  headers.forEach((h, idx) => {
    const header = String(h || '').replace(/\n/g, ' ');
    if (header.includes('Số CT')) colMap.orderNumber = idx;
    if (header.includes('Ngày CT')) colMap.orderDate = idx;
    if (header.includes('Mã KH')) colMap.customerCode = idx;
    if (header.includes('Mã') && header.includes('CH')) colMap.storeCode = idx;
    if (header.includes('Thanh toán')) colMap.netAmount = idx;
    if (header.includes('Thành tiền')) colMap.totalAmount = idx;
    if (header.includes('NV1 bán') || header.includes('NV bán')) colMap.salesStaff = idx;
  });

  // Parse rows
  const orders = [];
  const seen = new Set();

  for (let i = headerRowIdx + 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row) continue;

    const orderNumber = row[colMap.orderNumber];
    if (!orderNumber || seen.has(orderNumber)) continue;
    seen.add(orderNumber);

    const orderDate = parseVietnameseDate(row[colMap.orderDate]);

    orders.push({
      order_number: String(orderNumber),
      order_date: orderDate?.toISOString() || null,
      customer_code: row[colMap.customerCode] || null,
      store_code: row[colMap.storeCode] || null,
      net_amount: parseFloat(row[colMap.netAmount]) || 0,
      total_amount: parseFloat(row[colMap.totalAmount]) || 0,
      sales_staff: row[colMap.salesStaff] || null,
    });
  }

  return orders;
}

/**
 * Import Orders data
 */
async function importOrdersData(filePath) {
  console.log('\n🛒 Processing Orders file:', path.basename(filePath));

  const orders = parseOrdersFile(filePath);
  console.log(`   Valid orders: ${orders.length}`);

  if (orders.length === 0) {
    console.log('   ⚠️  No valid orders found');
    return 0;
  }

  // Get customer and store mappings
  console.log('   Loading mappings...');
  const { data: customers } = await supabase.from('customers').select('id, customer_code');
  const { data: stores } = await supabase.from('stores').select('id, store_code');

  const customerMap = {};
  customers?.forEach(c => { customerMap[c.customer_code] = c.id; });

  const storeMap = {};
  stores?.forEach(s => { storeMap[s.store_code] = s.id; });

  // Enrich orders
  const enrichedOrders = orders
    .filter(o => o.order_number && o.order_date)
    .map(o => ({
      order_number: o.order_number,
      order_date: o.order_date,
      customer_id: customerMap[o.customer_code] || null,
      store_id: storeMap[o.store_code] || null,
      net_amount: o.net_amount,
      total_amount: o.total_amount,
      sales_staff: o.sales_staff,
    }));

  // Upsert in batches
  const BATCH_SIZE = 500;
  let processed = 0;

  for (let i = 0; i < enrichedOrders.length; i += BATCH_SIZE) {
    const batch = enrichedOrders.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('orders')
      .upsert(batch, { onConflict: 'order_number', ignoreDuplicates: true });

    if (error) {
      console.error(`   ❌ Batch error:`, error.message);
    } else {
      processed += batch.length;
      console.log(`   ✅ Processed ${processed}/${enrichedOrders.length}`);
    }
  }

  return processed;
}

/**
 * Refresh all cache tables and materialized views
 */
async function refreshCaches() {
  console.log('\n🔄 Refreshing dashboard caches...');

  // 1. Update RFM metrics
  try {
    console.log('   Updating RFM metrics...');
    const { error } = await supabase.rpc('update_rfm_metrics');
    if (error && !error.message.includes('does not exist')) {
      console.log('   ⚠️  RFM:', error.message);
    } else {
      console.log('   ✅ RFM metrics updated');
    }
  } catch (err) {
    console.log('   ⚠️  RFM skipped');
  }

  // 2. Assign NPS order IDs (±30 day eligibility)
  try {
    console.log('   Assigning NPS order IDs...');
    const { error } = await supabase.rpc('assign_nps_order_ids');
    if (error && !error.message.includes('does not exist')) {
      console.log('   ⚠️  NPS assign:', error.message);
    } else {
      console.log('   ✅ NPS order IDs assigned');
    }
  } catch (err) {
    console.log('   ⚠️  NPS assign skipped');
  }

  // 3. Refresh NPS materialized views
  try {
    console.log('   Refreshing NPS views...');
    const { error } = await supabase.rpc('refresh_nps_views');
    if (error && !error.message.includes('does not exist')) {
      console.log('   ⚠️  NPS views:', error.message);
    } else {
      console.log('   ✅ NPS views refreshed');
    }
  } catch (err) {
    console.log('   ⚠️  NPS views skipped');
  }

  // 4. Refresh SMS/ZNS caches
  try {
    console.log('   Refreshing SMS caches...');
    const { data, error } = await supabase.rpc('refresh_all_sms_caches');

    if (error) {
      // Try individual refresh
      await supabase.rpc('refresh_sms_cache');
      await supabase.rpc('refresh_revenue_cache');
      console.log('   ✅ SMS caches refreshed');
    } else {
      console.log('   ✅ SMS caches refreshed');
    }
  } catch (err) {
    console.log('   ⚠️  SMS cache skipped');
  }

  console.log('   ✅ All dashboard caches refreshed!');
}

/**
 * Move file to processed folder
 */
function moveToProcessed(filePath) {
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const newName = `${timestamp}_${fileName}`;
  const newPath = path.join(PROCESSED_DIR, newName);

  fs.renameSync(filePath, newPath);
  console.log(`   📦 Moved to: processed/${newName}`);
}

/**
 * Process a file based on its directory
 */
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  // Skip temp files
  if (fileName.startsWith('~$') || fileName.startsWith('.')) {
    return;
  }

  if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
    console.log(`⏭️  Skipping: ${fileName}`);
    return;
  }

  // Wait for file to be fully written
  await new Promise(r => setTimeout(r, 2000));

  const dir = path.dirname(filePath);

  try {
    if (dir === SMS_DIR) {
      const count = await importSmsData(filePath);
      if (count > 0) {
        await refreshCaches();
        moveToProcessed(filePath);
      }
    } else if (dir === ORDERS_DIR) {
      const count = await importOrdersData(filePath);
      if (count > 0) {
        await refreshCaches();
        moveToProcessed(filePath);
      }
    }

    console.log('\n✨ Dashboard will auto-refresh with new data!\n');
    console.log('━'.repeat(60));
    console.log('👀 Watching for new files...\n');

  } catch (err) {
    console.error('❌ Error processing file:', err.message);
    console.error(err.stack);
  }
}

// Watch for new files
const watcher = chokidar.watch([SMS_DIR, ORDERS_DIR], {
  ignored: /(^|[\/\\])\.|~\$/,  // ignore dotfiles and temp files
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 500
  }
});

watcher
  .on('add', filePath => {
    const fileName = path.basename(filePath);
    if (!fileName.startsWith('~$')) {
      console.log(`\n📥 New file: ${fileName}`);
      processFile(filePath);
    }
  })
  .on('error', error => console.error('Watcher error:', error));

console.log('👀 Watching for new files...\n');

// Keep process running
process.on('SIGINT', () => {
  console.log('\n👋 Stopping auto-import...');
  watcher.close();
  process.exit(0);
});
