import { createClient } from "@/lib/supabase/server";

async function getRFMAnalytics() {
  const supabase = await createClient();

  // Get RFM distribution
  const { data: customers } = await supabase
    .from("customers")
    .select("rfm_score, rfm_r_score, rfm_f_score, rfm_m_score, rfm_monetary, rfm_frequency, rfm_recency")
    .not("rfm_score", "is", null);

  const allCustomers = customers || [];

  // RFM segment distribution
  const segmentDist: Record<string, { count: number; totalValue: number }> = {};
  allCustomers.forEach((c) => {
    const seg = c.rfm_score;
    if (!segmentDist[seg]) {
      segmentDist[seg] = { count: 0, totalValue: 0 };
    }
    segmentDist[seg].count++;
    segmentDist[seg].totalValue += parseFloat(c.rfm_monetary) || 0;
  });

  // Score distributions
  const rScores = [0, 0, 0, 0, 0]; // 1-4 + unknown
  const fScores = [0, 0, 0, 0, 0];
  const mScores = [0, 0, 0, 0, 0];

  allCustomers.forEach((c) => {
    if (c.rfm_r_score >= 1 && c.rfm_r_score <= 4) rScores[c.rfm_r_score - 1]++;
    if (c.rfm_f_score >= 1 && c.rfm_f_score <= 4) fScores[c.rfm_f_score - 1]++;
    if (c.rfm_m_score >= 1 && c.rfm_m_score <= 4) mScores[c.rfm_m_score - 1]++;
  });

  // Recency distribution (days)
  const recencyBuckets = { "0-30": 0, "31-90": 0, "91-180": 0, "181-365": 0, "365+": 0 };
  allCustomers.forEach((c) => {
    const days = c.rfm_recency || 999;
    if (days <= 30) recencyBuckets["0-30"]++;
    else if (days <= 90) recencyBuckets["31-90"]++;
    else if (days <= 180) recencyBuckets["91-180"]++;
    else if (days <= 365) recencyBuckets["181-365"]++;
    else recencyBuckets["365+"]++;
  });

  return {
    totalCustomers: allCustomers.length,
    segmentDist,
    rScores,
    fScores,
    mScores,
    recencyBuckets,
  };
}

export default async function AnalyticsPage() {
  const stats = await getRFMAnalytics();

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  const segmentColors: Record<string, { bg: string; border: string; text: string }> = {
    Champions: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400" },
    "Loyal Customers": { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400" },
    "Potential Loyalists": { bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-400" },
    "At Risk": { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400" },
    "New Customers": { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400" },
    Hibernating: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-400" },
  };

  const segments = Object.entries(stats.segmentDist)
    .map(([name, data]) => ({
      name,
      ...data,
      avgValue: data.count > 0 ? data.totalValue / data.count : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">RFM Analysis</h1>
        <p className="text-slate-400 mt-1">
          Customer segmentation based on Recency, Frequency, and Monetary value
        </p>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((seg) => {
          const colors = segmentColors[seg.name] || segmentColors.Hibernating;
          const pct = stats.totalCustomers > 0 ? ((seg.count / stats.totalCustomers) * 100).toFixed(1) : "0";

          return (
            <div
              key={seg.name}
              className={`${colors.bg} ${colors.border} border rounded-2xl p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${colors.text}`}>{seg.name}</h3>
                <span className="text-slate-400 text-sm">{pct}%</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold text-white">
                    {seg.count.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400">customers</p>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-700/50">
                  <div>
                    <p className="text-sm text-slate-400">Total Value</p>
                    <p className="font-medium text-white">
                      {formatCurrency(seg.totalValue)} VND
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Avg Value</p>
                    <p className="font-medium text-white">
                      {formatCurrency(seg.avgValue)} VND
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recency Distribution */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          Customer Recency Distribution
        </h2>
        <p className="text-slate-400 text-sm mb-6">Days since last purchase</p>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(stats.recencyBuckets).map(([bucket, count]) => {
            const pct = stats.totalCustomers > 0 ? (count / stats.totalCustomers) * 100 : 0;
            const isGood = bucket === "0-30" || bucket === "31-90";

            return (
              <div key={bucket} className="text-center">
                <div className="relative h-32 bg-slate-700/30 rounded-lg overflow-hidden mb-2">
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${
                      isGood ? "bg-gradient-to-t from-emerald-500 to-emerald-400" : "bg-gradient-to-t from-slate-500 to-slate-400"
                    } transition-all`}
                    style={{ height: `${Math.min(pct * 2, 100)}%` }}
                  />
                </div>
                <p className="text-white font-semibold">{count.toLocaleString()}</p>
                <p className="text-slate-400 text-sm">{bucket} days</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* RFM Score Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { title: "Recency Score", scores: stats.rScores, desc: "Lower is better (more recent)" },
          { title: "Frequency Score", scores: stats.fScores, desc: "Higher is better (more orders)" },
          { title: "Monetary Score", scores: stats.mScores, desc: "Higher is better (more spend)" },
        ].map((metric) => (
          <div key={metric.title} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">{metric.title}</h3>
            <p className="text-sm text-slate-400 mb-4">{metric.desc}</p>
            <div className="space-y-3">
              {metric.scores.map((count, i) => {
                const total = metric.scores.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Score {i + 1}</span>
                      <span className="text-slate-400">{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
