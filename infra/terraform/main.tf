locals {
  name         = "nightout-${var.environment}"
  is_prod      = var.environment == "prod"
  sub          = local.is_prod ? "" : "${var.environment}."
  web_domain   = var.base_domain == "" ? null : "${local.sub}${var.base_domain}"
  supabase_url = "https://${module.supabase.project_ref}.supabase.co"
}

module "supabase" {
  source            = "./modules/supabase-project"
  name              = local.name
  organization_id   = var.supabase_organization_id
  database_password = var.supabase_db_password
  region            = var.supabase_region
  site_url          = local.web_domain == null ? "http://localhost:5173" : "https://${local.web_domain}"
}

# Vercel project เดียว — root vercel.json กำหนด services (frontend "/", admin "/admin", backend "/api")
# build/install/output ของแต่ละ service อยู่ใน vercel.json ไม่ต้องตั้งที่ project
module "app" {
  source            = "./modules/vercel-project"
  name              = local.name
  github_repo       = var.github_repo
  production_branch = var.production_branch
  root_directory    = null
  framework         = null
  output_directory  = null
  build_command     = null
  install_command   = null
  domain            = local.web_domain
  env = {
    # ---- frontend + admin (Vite) — API เรียก same-origin /api จึงไม่ต้องตั้ง VITE_API_URL ----
    VITE_SUPABASE_URL      = { value = local.supabase_url, sensitive = false }
    VITE_SUPABASE_ANON_KEY = { value = var.supabase_anon_key, sensitive = false }

    # ---- backend (NestJS) ----
    NODE_ENV                  = { value = "production", sensitive = false }
    SUPABASE_URL              = { value = local.supabase_url, sensitive = false }
    SUPABASE_SERVICE_ROLE_KEY = { value = var.supabase_service_role_key, sensitive = true }
    CORS_ORIGINS              = { value = local.web_domain == null ? "" : "https://${local.web_domain}", sensitive = false }
    JOB_SECRET                = { value = var.job_secret, sensitive = true }
    QR_SIGNING_KEY            = { value = var.qr_signing_key, sensitive = true }
    LINE_CHANNEL_ACCESS_TOKEN = { value = var.line_channel_access_token, sensitive = true }
  }
}
