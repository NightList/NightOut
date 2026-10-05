import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTPayload } from 'jose';
import type { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

export interface AuthUser {
  id: string;
  email?: string;
  /** Authenticator Assurance Level — admin ต้องเป็น aal2 (MFA) */
  aal?: string;
  /** ชั้นบัญชีจาก public.users — มีเฉพาะหลัง AdminGuard */
  role?: string;
}

export type AuthedRequest = Request & { user?: AuthUser };

/**
 * ตรวจ Supabase access token (Bearer)
 * 1) verify ด้วย JWKS ของโปรเจกต์ (โปรเจกต์ที่ใช้ JWT signing keys)
 * 2) ถ้าไม่ได้ (เช่นโปรเจกต์ยังใช้ HS256) → ถาม Supabase Auth ตรง (/auth/v1/user)
 */
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(
    config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
    const url = config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    this.issuer = `${url}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      const { payload } = await jwtVerify<JWTPayload & { email?: string; aal?: string }>(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      });
      req.user = { id: payload.sub!, email: payload.email, aal: payload.aal };
      return true;
    } catch {
      // ไปถาม Supabase Auth แทน
    }

    const user = await this.supabase.getUser(token);
    if (!user) throw new UnauthorizedException('Invalid token');
    // token ผ่านการตรวจจาก Supabase แล้ว → อ่าน aal จาก payload ได้
    const claims = decodeJwt(token) as JWTPayload & { aal?: string };
    req.user = { id: user.id, email: user.email, aal: claims.aal };
    return true;
  }
}
