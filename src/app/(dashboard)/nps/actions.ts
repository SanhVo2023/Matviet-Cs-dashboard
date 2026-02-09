"use server";

import { createClient } from "@/lib/supabase/server";

export async function refreshNPSData() {
  try {
    const supabase = await createClient();

    // Step 1: Sync NPS data from Google Sheet via edge function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const syncResponse = await fetch(
      `${supabaseUrl}/functions/v1/sync-nps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
      }
    );

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      return { success: false, error: `Sync failed: ${errorText}` };
    }

    const syncResult = await syncResponse.json();
    console.log("Sync result:", syncResult);

    // Step 2: Assign order IDs with ±30 day eligibility
    const { error: assignError } = await supabase.rpc("assign_nps_order_ids");
    if (assignError) {
      console.error("Assign error:", assignError);
      // Continue anyway
    }

    // Step 3: Refresh materialized views
    const { error: refreshError } = await supabase.rpc("refresh_nps_views");
    if (refreshError) {
      return { success: false, error: `Refresh views failed: ${refreshError.message}` };
    }

    const stats = syncResult.stats || {};
    return {
      success: true,
      stats: {
        npsInserted: stats.nps_inserted || 0,
        eligible: stats.nps_with_orders || stats.matched || 0,
        total: stats.total_rows || 0,
      },
    };
  } catch (error) {
    console.error("Refresh error:", error);
    return { success: false, error: String(error) };
  }
}
