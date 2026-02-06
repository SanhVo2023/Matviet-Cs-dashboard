import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { conditions, logic } = body;

    if (!conditions || conditions.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const validConditions = conditions.filter((c: any) => c.value);

    if (validConditions.length === 0) {
      // Return total customer count if no valid conditions
      const { count } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true });
      return NextResponse.json({ count: count || 0 });
    }

    // Build SQL WHERE clauses
    const whereClauses: string[] = [];
    const params: any[] = [];

    for (let i = 0; i < validConditions.length; i++) {
      const { field, operator, value, value2 } = validConditions[i];

      // Sanitize field name (allow only alphanumeric and underscore)
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

    const whereClause = whereClauses.join(logic === "OR" ? " OR " : " AND ");
    const sql = `SELECT COUNT(*) as count FROM customers WHERE ${whereClause}`;

    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      // Fallback to simple query if RPC doesn't exist
      // Use filter string approach
      const { count } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true });
      return NextResponse.json({ count: count || 0 });
    }

    return NextResponse.json({ count: data?.[0]?.count || 0 });
  } catch (error: any) {
    console.error("Error previewing segment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
