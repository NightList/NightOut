import {
  type ArgumentsHost,
  Catch,
  type CallHandler,
  type ExceptionFilter,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type ApiResponse, errorMessageOf } from '@nightout/contracts';
import { ZodValidationException } from 'nestjs-zod';
import { map, type Observable } from 'rxjs';

/**
 * รูปแบบคำตอบกลางของทุก endpoint (`ApiResponse` ใน @nightout/contracts) — ลงทะเบียนครั้งเดียวใน app.module.ts
 *   สำเร็จ: { status: 'ok', status_code, data, code: null, err_msg: null }
 *   error:  { status: 'no', status_code, data: null, code: 'ZONE_FULL', err_msg: 'ข้อความไทย' }
 * HTTP status ยังเป็นค่าจริง (201 / 400 / 409 …) · controller คืน data ตามปกติ ไม่ต้องห่อเอง
 */

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<unknown>> {
    const res = ctx.switchToHttp().getResponse<{ statusCode: number }>();
    return next.handle().pipe(map((data: unknown) => ({ status: 'ok', status_code: res.statusCode, data: data ?? null, code: null, err_msg: null })));
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger('API');

  catch(e: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const { status, code, err_msg } = toError(e);
    if (status >= 500) {
      const req = http.getRequest<{ method?: string; url?: string }>();
      this.log.error(`${req.method} ${req.url} → ${status} ${code}`, e instanceof Error ? e.stack : String(e));
    }
    const body: ApiResponse<null> = { status: 'no', status_code: status, data: null, code, err_msg };
    res.status(status).json(body);
  }
}

/** แปลง error ทุกแบบ (zod / guard / throttler / Supabase / bug) เป็นรหัส + ข้อความไทย */
function toError(e: unknown): { status: number; code: string; err_msg: string } {
  if (e instanceof ZodValidationException) {
    const issues = (e.getResponse() as { errors?: { path?: PropertyKey[] }[] }).errors ?? [];
    const fields = [...new Set(issues.map((i) => i.path?.join('.')).filter(Boolean))].join(', ');
    return { status: 400, code: 'VALIDATION_FAILED', err_msg: errorMessageOf('VALIDATION_FAILED') + (fields ? ` (${fields})` : '') };
  }
  if (e instanceof HttpException) {
    const status = e.getStatus();
    if (status === HttpStatus.TOO_MANY_REQUESTS) return { status, code: 'TOO_MANY_REQUESTS', err_msg: errorMessageOf('TOO_MANY_REQUESTS') };
    const r = e.getResponse();
    const msg = typeof r === 'string' ? r : (r as { message?: string | string[] }).message;
    const code = (Array.isArray(msg) ? msg.join(', ') : msg) || e.message;
    return { status, code, err_msg: errorMessageOf(code) };
  }
  return { status: 500, code: 'INTERNAL_ERROR', err_msg: errorMessageOf('INTERNAL_ERROR') };
}
