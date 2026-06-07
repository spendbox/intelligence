import { supabaseAdmin } from "@/lib/supabase/server";
import OrderWizard from "./OrderWizard";

export const dynamic = "force-dynamic";

async function loadIndustries() {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from("categories").select("id, slug, name").eq("active", true).order("name");
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function OrderPage() {
  const industries = await loadIndustries();
  return <OrderWizard industries={industries} />;
}
