"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Users, AlertCircle } from "lucide-react";

type ConditionField =
  | "lifecycle_stage"
  | "clv_tier"
  | "rfm_score"
  | "order_count"
  | "total_spent"
  | "avg_order_value"
  | "churn_risk"
  | "days_to_next_purchase"
  | "purchase_frequency";

type ConditionOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "between" | "in";

interface Condition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
  value2?: string; // For "between" operator
}

const fieldOptions: { value: ConditionField; label: string; type: "select" | "number" }[] = [
  { value: "lifecycle_stage", label: "Lifecycle Stage", type: "select" },
  { value: "clv_tier", label: "CLV Tier", type: "select" },
  { value: "rfm_score", label: "RFM Segment", type: "select" },
  { value: "order_count", label: "Order Count", type: "number" },
  { value: "total_spent", label: "Total Spent (VND)", type: "number" },
  { value: "avg_order_value", label: "Avg Order Value", type: "number" },
  { value: "churn_risk", label: "Churn Risk (%)", type: "number" },
  { value: "days_to_next_purchase", label: "Days to Next Purchase", type: "number" },
  { value: "purchase_frequency", label: "Purchase Frequency (days)", type: "number" },
];

const lifecycleOptions = ["new", "active", "loyal", "at_risk", "churned", "reactivated"];
const clvTierOptions = ["vip", "high", "medium", "low"];
const rfmOptions = [
  "Champions", "Loyal Customers", "Potential Loyalists", "New Customers",
  "Promising", "Need Attention", "About to Sleep", "At Risk",
  "Can't Lose Them", "Hibernating", "Lost"
];

const operatorOptions: { value: ConditionOperator; label: string; forTypes: ("select" | "number")[] }[] = [
  { value: "equals", label: "Equals", forTypes: ["select", "number"] },
  { value: "not_equals", label: "Does not equal", forTypes: ["select", "number"] },
  { value: "greater_than", label: "Greater than", forTypes: ["number"] },
  { value: "less_than", label: "Less than", forTypes: ["number"] },
  { value: "between", label: "Between", forTypes: ["number"] },
  { value: "in", label: "Is one of", forTypes: ["select"] },
];

export default function CreateSegmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "1", field: "lifecycle_stage", operator: "equals", value: "" },
  ]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now().toString(), field: "order_count", operator: "greater_than", value: "" },
    ]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((c) => c.id !== id));
    }
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const getFieldType = (field: ConditionField) => {
    return fieldOptions.find((f) => f.value === field)?.type || "number";
  };

  const getSelectOptions = (field: ConditionField) => {
    switch (field) {
      case "lifecycle_stage":
        return lifecycleOptions;
      case "clv_tier":
        return clvTierOptions;
      case "rfm_score":
        return rfmOptions;
      default:
        return [];
    }
  };

  const previewSegment = async () => {
    setPreviewing(true);
    setError("");
    try {
      const response = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, logic }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPreviewCount(data.count);
      }
    } catch (err) {
      setError("Failed to preview segment");
    } finally {
      setPreviewing(false);
    }
  };

  const saveSegment = async () => {
    if (!name.trim()) {
      setError("Please enter a segment name");
      return;
    }

    const validConditions = conditions.filter((c) => c.value);
    if (validConditions.length === 0) {
      setError("Please add at least one condition with a value");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          rule_type: "custom",
          conditions: { logic, rules: validConditions },
        }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        router.push("/segments");
      }
    } catch (err) {
      setError("Failed to save segment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/segments"
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Custom Segment</h1>
          <p className="text-slate-400 mt-1">Define rules to group customers</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Segment Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Segment Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value At Risk"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this segment and its purpose..."
              rows={2}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Conditions</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Match</span>
            <select
              value={logic}
              onChange={(e) => setLogic(e.target.value as "AND" | "OR")}
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="AND">ALL conditions (AND)</option>
              <option value="OR">ANY condition (OR)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {conditions.map((condition, index) => {
            const fieldType = getFieldType(condition.field);
            const availableOperators = operatorOptions.filter((op) => op.forTypes.includes(fieldType));

            return (
              <div key={condition.id} className="flex items-center gap-3">
                {index > 0 && (
                  <span className="w-12 text-center text-sm text-slate-500 font-medium">{logic}</span>
                )}
                {index === 0 && <span className="w-12 text-center text-sm text-slate-500">Where</span>}

                {/* Field */}
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(condition.id, {
                    field: e.target.value as ConditionField,
                    operator: "equals",
                    value: ""
                  })}
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  {fieldOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as ConditionOperator })}
                  className="w-40 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  {availableOperators.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Value */}
                {fieldType === "select" ? (
                  <select
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select value...</option>
                    {getSelectOptions(condition.field).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : condition.operator === "between" ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      placeholder="Min"
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-500">and</span>
                    <input
                      type="number"
                      value={condition.value2 || ""}
                      onChange={(e) => updateCondition(condition.id, { value2: e.target.value })}
                      placeholder="Max"
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder="Enter value..."
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                )}

                {/* Remove */}
                <button
                  onClick={() => removeCondition(condition.id)}
                  disabled={conditions.length === 1}
                  className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={addCondition}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Condition
        </button>
      </div>

      {/* Preview & Actions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={previewSegment}
              disabled={previewing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <Users className="h-5 w-5" />
              {previewing ? "Previewing..." : "Preview Segment"}
            </button>

            {previewCount !== null && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <Users className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  {previewCount.toLocaleString()} customers match
                </span>
              </div>
            )}
          </div>

          <button
            onClick={saveSegment}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {saving ? "Saving..." : "Save Segment"}
          </button>
        </div>
      </div>
    </div>
  );
}
