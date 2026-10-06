import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

describe('NightOut API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });

  it('GET /health', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /pricing/estimate validates and calculates', async () => {
    const res = await request(app.getHttpServer())
      .post('/pricing/estimate')
      .send({
        items: [{ name: 'set', qty: 2, unit_price: 1000 }],
        fees: { service_charge_rate: 10, vat_rate: 7, other_fees: 0 },
        pax: 4,
      })
      .expect(200);
    expect(res.body.estimated_total).toBe(2354);
    expect(res.body.per_person).toBe(588.5);
  });

  it('POST /pricing/estimate rejects invalid body', async () => {
    await request(app.getHttpServer()).post('/pricing/estimate').send({ pax: 0 }).expect(400);
  });

  it('POST /jobs/* requires the job secret', async () => {
    await request(app.getHttpServer()).post('/jobs/booking-timeouts').expect(401);
    await request(app.getHttpServer())
      .post('/jobs/booking-timeouts')
      .set('x-job-secret', 'test-job-secret')
      .expect(200);
  });

  // ADR 0002: หน้าเว็บอ่านข้อมูลผ่าน API — endpoint ของผู้ใช้ต้องล็อกอิน · ข้อมูลที่ส่งมาต้องผ่าน validation
  it('GET /me/* requires a bearer token', async () => {
    await request(app.getHttpServer()).get('/me/overview').expect(401);
    await request(app.getHttpServer()).get('/me/profile').expect(401);
    await request(app.getHttpServer()).get('/merchant/bars/00000000-0000-4000-8000-000000000000/team').expect(401);
    await request(app.getHttpServer()).post('/storage/upload-url').send({ bucket: 'deposit-slips', path: 'a/b.jpg' }).expect(401);
  });

  it('GET /admin/* (reads) requires a bearer token', async () => {
    await request(app.getHttpServer()).get('/admin/dashboard').expect(401);
    await request(app.getHttpServer()).get('/admin/views/admin_bars').expect(401);
    await request(app.getHttpServer()).get('/admin/master/styles').expect(401);
    await request(app.getHttpServer()).get('/admin/roles').expect(401);
    await request(app.getHttpServer()).patch('/admin/users/00000000-0000-4000-8000-000000000000/role').send({ role: 'ADMIN' }).expect(401);
    await request(app.getHttpServer()).post('/admin/team-members').send({ nickname: 'x' }).expect(401);
    await request(app.getHttpServer()).post('/admin/users').send({ email: 'a@b.co' }).expect(401);
    await request(app.getHttpServer()).put('/admin/team-members/order').send({ ids: [] }).expect(401);
  });

  it('read endpoints validate input before touching Supabase', async () => {
    await request(app.getHttpServer()).get('/bars/not-a-uuid/zone-availability?datetime=2026-10-03T20:00:00%2B07:00').expect(400);
    await request(app.getHttpServer()).get('/bars/00000000-0000-4000-8000-000000000000/zone-availability').expect(400);
    await request(app.getHttpServer()).post('/storage/signed-urls').send({ bucket: 'secret-bucket', paths: ['x/y.jpg'] }).expect(400);
    await request(app.getHttpServer()).post('/storage/signed-urls').send({ bucket: 'review-media', paths: ['../etc/passwd'] }).expect(400);
  });
});
