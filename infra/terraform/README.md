# infra/terraform

สร้าง **Vercel** (project เดียว — services frontend/admin/backend ตาม `vercel.json` ที่ root) + **Supabase** ต่อ environment

```bash
cd infra/terraform
terraform init
terraform workspace new dev        # ครั้งแรก
terraform workspace select dev
cp envs/dev.tfvars.example envs/dev.tfvars   # ไม่ถูก commit (.gitignore)
export TF_VAR_vercel_api_token=... TF_VAR_supabase_access_token=... \
       TF_VAR_supabase_db_password=... TF_VAR_job_secret=... TF_VAR_qr_signing_key=...
terraform plan  -var-file=envs/dev.tfvars
terraform apply -var-file=envs/dev.tfvars
```

- Schema / RLS ไม่ได้อยู่ใน Terraform — ใช้ `supabase db push` จาก `apps/backend` (`pnpm --filter @nightout/backend db:push`)
- `supabase_anon_key` / `supabase_service_role_key` ได้หลังสร้าง project ครั้งแรก แล้ว apply อีกรอบ
- ⚠️ ยังไม่ได้ `terraform validate` กับ provider จริง — ตรวจ `terraform plan` ก่อน apply ครั้งแรก
