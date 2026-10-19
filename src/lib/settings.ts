import { cache } from "react";
import { adminClient } from "./supabase/admin";

/** Site-wide switches from the owner panel (public.app_settings, one row). */
export type AppSettings = { openAccess: boolean };

/** Read once per request. A failed read means normal limits, so a database hiccup never lifts them. */
export const appSettings = cache(async (): Promise<AppSettings> => {
  const { data, error } = await adminClient().from("app_settings").select("open_access").eq("id", true).maybeSingle();
  if (error) console.error("[settings] read failed", error);
  return { openAccess: Boolean(data?.open_access) };
});

export async function setOpenAccess(on: boolean) {
  const { error } = await adminClient().from("app_settings").upsert({ id: true, open_access: on, updated_at: new Date().toISOString() }, { onConflict: "id" });
  return !error;
}
