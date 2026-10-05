variable "environment" {
  description = "dev | staging | prod"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging or prod."
  }
}

variable "github_repo" {
  description = "owner/repo ที่ Vercel ผูก"
  type        = string
  default     = "genminigpt/NightOut"
}

variable "production_branch" {
  type    = string
  default = "main"
}

variable "base_domain" {
  description = "เช่น nightout.app (prod) — ว่างไว้ถ้ายังไม่มีโดเมน"
  type        = string
  default     = ""
}

# ---- Vercel ----
variable "vercel_api_token" {
  type      = string
  sensitive = true
}

variable "vercel_team_id" {
  type    = string
  default = null
}

# ---- Supabase ----
variable "supabase_access_token" {
  type      = string
  sensitive = true
}

variable "supabase_organization_id" {
  type = string
}

variable "supabase_db_password" {
  type      = string
  sensitive = true
}

variable "supabase_region" {
  type    = string
  default = "ap-southeast-1"
}

# ---- App secrets ----
variable "job_secret" {
  type      = string
  sensitive = true
}

variable "qr_signing_key" {
  type      = string
  sensitive = true
}

variable "line_channel_access_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "supabase_anon_key" {
  description = "ได้หลังสร้าง project (Supabase dashboard → API)"
  type        = string
  default     = ""
}

variable "supabase_service_role_key" {
  type      = string
  sensitive = true
  default   = ""
}
