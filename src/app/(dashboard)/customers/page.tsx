import { createClient } from "@/lib/supabase/server";
import { Search, Filter, ChevronRight } from "lucide-react";
import Link from "next/link";

async function getCustomers(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select(
      "id, customer_code, name, email, phone, rfm_score, rfm_frequency, rfm_monetary, last_purchase"
    )
    .order("rfm_monetary", { ascending: false, nullsFirst: false })
    .limit(50);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,customer_code.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  return data || [];
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const customers = await getCustomers(params.q);

  const formatCurrency = (value: number | null) => {
    if (!value) return "0";
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
  };

  const rfmBadgeColor: Record<string, string> = {
    Champions: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "Loyal Customers": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Potential Loyalists": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "New Customers": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Hibernating: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 mt-1">
            Manage and view customer profiles
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <form className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Search by name, phone, or email..."
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </form>
        <button className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all">
          <Filter className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* Customer Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                Customer
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                Segment
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                Orders
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                Total Spent
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                Last Purchase
              </th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-slate-700/20 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{customer.name}</p>
                    <p className="text-sm text-slate-400">
                      {customer.customer_code}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {customer.rfm_score && (
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                        rfmBadgeColor[customer.rfm_score] ||
                        "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {customer.rfm_score}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-slate-300">
                  {customer.rfm_frequency || 0}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-white font-medium">
                    {formatCurrency(customer.rfm_monetary)} VND
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-slate-400 text-sm">
                  {customer.last_purchase
                    ? new Date(customer.last_purchase).toLocaleDateString(
                        "vi-VN"
                      )
                    : "-"}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No customers found
          </div>
        )}
      </div>
    </div>
  );
}
