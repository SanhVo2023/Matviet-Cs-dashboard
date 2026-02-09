import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, description, rule_type, conditions } = body;

    if (!name || !conditions) {
      return NextResponse.json({ error: "Name and conditions are required" }, { status: 400 });
    }

    // Insert the segment rule
    const { data: segment, error: insertError } = await supabase
      .from("segment_rules")
      .insert({
        name,
        description,
        rule_type: rule_type || "custom",
        conditions,
        is_active: true,
        customer_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Calculate customer count using the conditions
    const count = await calculateSegmentCount(supabase, conditions);

    // Update the count
    await supabase
      .from("segment_rules")
      .update({ customer_count: count })
      .eq("id", segment.id);

    return NextResponse.json({ ...segment, customer_count: count });
  } catch (error: any) {
    console.error("Error creating segment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: segments, error } = await supabase
      .from("segment_rules")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(segments);
  } catch (error: any) {
    console.error("Error fetching segments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function calculateSegmentCount(supabase: any, conditions: any): Promise<number> {
  const { logic, rules } = conditions;

  if (!rules || rules.length === 0) return 0;

  const validConditions = rules.filter((c: any) => c.value);

  if (validConditions.length === 0) {
    const { count } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true });
    return count || 0;
  }

  // Build SQL WHERE clauses
  const whereClauses: string[] = [];

  for (const condition of validConditions) {
    const { field, operator, value, value2 } = condition;
    const safeField = field.replace(/[^a-zA-Z0-9_]/g, "");

    switch (operator) {
      case "equals":
        whereClauses.push(`${safeField} = '${value}'`);
        break;
      case "not_equals":
        whereClauses.push(`${safeField} != '${value}'`);
        break;
      case "greater_than":
        whereClauses.push(`${safeField} > ${parseFloat(value)}`);
        break;
      case "less_than":
        whereClauses.push(`${safeField} < ${parseFloat(value)}`);
        break;
      case "between":
        if (value2) {
          whereClauses.push(`${safeField} BETWEEN ${parseFloat(value)} AND ${parseFloat(value2)}`);
        }
        break;
      case "in":
        const values = value.split(",").map((v: string) => `'${v.trim()}'`).join(",");
        whereClauses.push(`${safeField} IN (${values})`);
        break;
    }
  }

  // Fall back to simple count if no valid clauses
  if (whereClauses.length === 0) {
    const { count } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true });
    return count || 0;
  }

  // Try RPC first, fallback to simple count
  try {
    const whereClause = whereClauses.join(logic === "OR" ? " OR " : " AND ");
    const sql = `SELECT COUNT(*) as count FROM customers WHERE ${whereClause}`;
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (!error && data?.[0]?.count !== undefined) {
      return data[0].count;
    }
  } catch (e) {
    console.error("RPC error:", e);
  }

  // Fallback
  const { count } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true });
  return count || 0;
}
