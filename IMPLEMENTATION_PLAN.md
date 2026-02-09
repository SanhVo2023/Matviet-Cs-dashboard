# Mắt Việt CRM/CDP Implementation Plan

## Overview
Transform the current analytics dashboard into a full CRM/CDP with customer segmentation, campaign management, and engagement tracking.

---

## Phase 1: Customer Segmentation & Customer 360 (Priority)

### 1.1 Database Schema Updates

```sql
-- Customer lifecycle and behavioral metrics
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS clv_predicted DECIMAL(15,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS clv_tier VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS engagement_score INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS churn_risk DECIMAL(5,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS days_to_next_purchase INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_channel VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_category VARCHAR(100);

-- Custom segment rules
CREATE TABLE segment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50), -- 'rfm', 'lifecycle', 'behavioral', 'clv', 'custom'
  conditions JSONB NOT NULL, -- JSON rules for filtering
  is_active BOOLEAN DEFAULT true,
  customer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer segment assignments (many-to-many)
CREATE TABLE customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  segment_rule_id UUID REFERENCES segment_rules(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  score DECIMAL(5,2), -- relevance score
  UNIQUE(customer_id, segment_rule_id)
);

-- Customer engagement timeline
CREATE TABLE customer_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  engagement_type VARCHAR(50) NOT NULL, -- 'purchase', 'campaign_sent', 'campaign_opened', 'nps_response', 'store_visit'
  channel VARCHAR(50), -- 'sms', 'email', 'zalo', 'in_store', 'website'
  reference_id UUID, -- order_id, campaign_id, nps_id
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Segmentation Methods Implementation

#### A. Lifecycle Stage Segmentation
- **New**: First purchase within 30 days
- **Active**: Purchased within expected frequency
- **Loyal**: 5+ orders AND purchased within 60 days
- **At Risk**: Past expected purchase date by 30-60 days
- **Churned**: No purchase for 90+ days
- **Reactivated**: Returned after being churned

#### B. CLV Calculation & Tiers
- **Formula**: (Avg Order Value × Purchase Frequency × Expected Lifespan) - Acquisition Cost
- **Tiers**: VIP (top 5%), High (top 20%), Medium (50%), Low (bottom 30%)

#### C. Behavioral Segmentation
- Product category preferences (glasses, sunglasses, accessories)
- Purchase channel preference (which store)
- Price sensitivity (discount usage)
- Purchase timing (weekday/weekend, time of day)

#### D. Custom Segment Builder
- Rule-based segment creation UI
- Conditions: AND/OR logic
- Fields: any customer attribute, RFM scores, lifecycle, dates

### 1.3 Customer 360 Enhanced Page

New sections:
- **Engagement Timeline**: All touchpoints in chronological order
- **Segment Memberships**: Which segments customer belongs to
- **Predictive Metrics**: CLV, churn risk, next purchase date
- **Campaign History**: All campaigns sent, with outcomes

### 1.4 New Dashboard Pages

- `/segments` - Segment management & overview
- `/segments/[id]` - Segment detail with customer list
- `/segments/create` - Segment builder UI

---

## Phase 2: Campaign Management

### 2.1 Database Schema

```sql
-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL, -- 'sms', 'email', 'zalo'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'cancelled'

  -- Targeting
  target_type VARCHAR(50), -- 'segment', 'csv_upload', 'manual'
  segment_rule_id UUID REFERENCES segment_rules(id),
  target_count INTEGER DEFAULT 0,

  -- Content
  message_content TEXT,
  message_template_id VARCHAR(100), -- for Zalo ZNS

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Costs
  budget DECIMAL(15,2),
  cost_per_message DECIMAL(10,4),
  total_cost DECIMAL(15,2),

  -- Attribution window
  attribution_days INTEGER DEFAULT 7,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign targets
CREATE TABLE campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  customer_id UUID REFERENCES customers(id),
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(campaign_id, customer_id)
);

-- Campaign costs breakdown
CREATE TABLE campaign_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  cost_type VARCHAR(50), -- 'sms', 'email', 'design', 'other'
  amount DECIMAL(15,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue attribution
CREATE TABLE campaign_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  attributed_revenue DECIMAL(15,2),
  attribution_type VARCHAR(50), -- 'direct', 'influenced'
  days_after_campaign INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 eSMS Integration

- API endpoint integration for SMS sending
- Delivery status callbacks
- Cost tracking per message
- Error handling and retry logic

### 2.3 Campaign UI Pages

- `/campaigns` - Campaign list with status
- `/campaigns/create` - Create new campaign
- `/campaigns/[id]` - Campaign detail & performance
- `/campaigns/[id]/analytics` - Deep analytics

---

## Phase 3: Analytics & Reporting

### 3.1 Campaign Performance Dashboard

- **KPIs**: Sent, Delivered, Opened, Clicked, Converted
- **ROI Metrics**: Cost, Revenue, ROI%, ROAS
- **Trends**: Performance over time
- **Comparisons**: By channel, by segment

### 3.2 Segment Performance Analytics

- Revenue by segment
- Growth/decline trends
- Segment migration (customers moving between segments)
- Best performing segments

### 3.3 Customer Engagement Analytics

- Engagement score distribution
- Channel effectiveness
- Optimal send times
- Churn prediction accuracy

---

## Implementation Order

### Week 1-2: Database & Segmentation Logic
- [ ] Create new database tables
- [ ] Implement lifecycle stage calculation (Edge Function)
- [ ] Implement CLV calculation
- [ ] Create segmentation Edge Functions

### Week 3-4: Segmentation UI
- [ ] Segments list page
- [ ] Segment detail page
- [ ] Custom segment builder
- [ ] Enhanced Customer 360

### Week 5-6: Campaign Management
- [ ] Campaign database tables
- [ ] Campaign creation UI
- [ ] Target selection (segment/CSV)
- [ ] eSMS API integration

### Week 7-8: Analytics & Polish
- [ ] Campaign performance dashboard
- [ ] Segment analytics
- [ ] Attribution tracking
- [ ] Testing & optimization

---

## Technical Stack

- **Frontend**: Next.js 16 + Tailwind CSS + Recharts
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **SMS**: eSMS Vietnam API
- **Email**: (TBD - Mailgun/SendGrid/AWS SES)
- **Zalo**: Zalo ZNS API

---

## Success Metrics

1. **Segmentation Accuracy**: % of customers correctly classified
2. **Campaign ROI**: Average ROI across campaigns
3. **CLV Prediction**: Accuracy of predicted vs actual CLV
4. **Engagement Score**: Correlation with actual purchases
5. **Churn Prevention**: % of at-risk customers retained

---

## Sources & References

- [CDP Features 2025 - CMSWire](https://www.cmswire.com/customer-data-platforms/what-is-a-customer-data-platform-cdp/)
- [Customer Segmentation - Twilio Segment](https://segment.com/customer-data-platform/)
- [CLV with Behavioral Segmentation](https://www.phoenixstrategy.group/blog/how-to-measure-clv-with-behavioral-segmentation)
- [Customer Lifetime Value - McKinsey](https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/customer-lifetime-value-the-customer-compass)
