import { react } from '@nightout/config/eslint';

/**
 * ADR 0002: หน้าเว็บห้ามเรียก DB ตรง — ใช้ Rest (@nightout/utils/rest) เท่านั้น
 * supabase-js ในหน้าเว็บใช้ได้เฉพาะ supabase.auth.*
 */
const noDirectDb = {
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='supabase'][property.name=/^(from|rpc|storage|schema|channel|realtime)$/]",
        message: 'ห้ามเรียก DB/Storage ตรงจากหน้าเว็บ — ใช้ Rest จาก @nightout/utils/rest (ADR 0002)',
      },
    ],
  },
};

export default [...(Array.isArray(react) ? react : [react]), noDirectDb];
