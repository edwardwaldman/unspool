import { cache } from "react";
import { adminClient } from "./supabase/admin";

/** Site-wide switches from the owner panel (public.app_settings, one row). */
export type AppSettings = { openAccess: boolean; ownerNetworks: string[] };

/** Read once per request. A failed read means normal limits, so a database hiccup never lifts them. */
export const appSettings = cache(async (): Promise<AppSettings> => {
  const { data, error } = await adminClient().from("app_settings").select("open_access,owner_ip_hashes").eq("id", true).maybeSingle();
  if (error) console.error("[settings] read failed", error);
  return { openAccess: Boolean(data?.open_access), ownerNetworks: (data?.owner_ip_hashes as string[] | null) ?? [] };
});

export async function setOpenAccess(on: boolean) {
  const { error } = await adminClient().from("app_settings").upsert({ id: true, open_access: on, updated_at: new Date().toISOString() }, { onConflict: "id" });
  return !error;
}

/** How many of the owner's recent networks stay trusted (home, phone, school...). */
const OWNER_NETWORKS = 5;

/**
 * Remember the network (salted IP hash) the verified owner is using, so test accounts made on it skip the
 * per-network free limits. Only called for the verified owner; a no-op when the network is already known.
 */
export async function rememberOwnerNetwork(ipHash: string) {
  const { ownerNetworks } = await appSettings();
  if (!ipHash || ownerNetworks.includes(ipHash)) return;
  const next = [ipHash, ...ownerNetworks].slice(0, OWNER_NETWORKS);
  const { error } = await adminClient().from("app_settings").update({ owner_ip_hashes: next, updated_at: new Date().toISOString() }).eq("id", true);
  if (error) console.error("[settings] remember owner network failed", error);
}
