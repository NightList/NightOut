terraform {
  required_version = ">= 1.9"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 3.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.5"
    }
  }

  # แยก state ต่อ environment ด้วย workspace: terraform workspace select dev|staging|prod
  # backend "remote" {
  #   organization = "nightout"
  #   workspaces { prefix = "nightout-" }
  # }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

provider "supabase" {
  access_token = var.supabase_access_token
}
