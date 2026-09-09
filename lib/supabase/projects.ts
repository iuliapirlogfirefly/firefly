import projects from "../../supabase/projects.json";

export const PRODUCTION_PROJECT_REF = projects.production;
export const STAGING_PROJECT_REF = projects.staging;

export function isProductionSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes(`${PRODUCTION_PROJECT_REF}.supabase.co`);
}
