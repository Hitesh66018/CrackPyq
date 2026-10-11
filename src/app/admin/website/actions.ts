import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateHomepageSettings(formData: FormData) {
  "use server";
  
  const hero_title = formData.get("hero_title") as string;
  const hero_subtitle = formData.get("hero_subtitle") as string;
  const announcement = formData.get("announcement") as string;

  const value = { hero_title, hero_subtitle, announcement };

  await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", "homepage");

  revalidatePath("/admin/website");
  revalidatePath("/"); // Update the public homepage too
}
