// Database types for Mắt Việt CDP

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  rfm_recency?: number;
  rfm_frequency?: number;
  rfm_monetary?: number;
  rfm_r_score?: number;
  rfm_f_score?: number;
  rfm_m_score?: number;
  rfm_score?: string;
  first_purchase?: string;
  last_purchase?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_date: string;
  customer_id?: string;
  store_id?: string;
  sales_staff?: string;
  total_amount?: number;
  total_discount?: number;
  net_amount?: number;
  payment_method?: string;
  created_at: string;
}

export interface Store {
  id: string;
  store_code: string;
  name: string;
  address?: string;
}

export interface NPSResponse {
  id: string;
  customer_id?: string;
  order_id?: string;
  score: number;
  category?: string;
  feedback?: string;
  channel?: string;
  responded_at?: string;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  category?: string;
  product_type?: string;
}

// Analytics types
export interface DateRange {
  from: string;
  to: string;
}

export interface FilterState {
  dateRange: DateRange;
  storeId?: string;
  segment?: string;
}

export interface KPIData {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

export interface SegmentData {
  name: string;
  count: number;
  value: number;
  percentage: number;
}
