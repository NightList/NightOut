import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { toPostgrestQuery } from './backoffice.admin.controller';

describe('toPostgrestQuery (admin views)', () => {
  it('builds eq / in / order / limit', () => {
    expect(toPostgrestQuery({ status: 'APPROVED', order: 'score.desc' })).toBe('select=*&status=eq.APPROVED&order=score.desc&limit=1000');
    expect(decodeURIComponent(toPostgrestQuery({ status: 'PENDING_REVIEW,DRAFT', limit: '50' }))).toBe(
      'select=*&status=in.("PENDING_REVIEW","DRAFT")&limit=50',
    );
  });
  it('rejects unsafe input', () => {
    expect(() => toPostgrestQuery({ 'role;drop': 'x' })).toThrow(BadRequestException);
    expect(() => toPostgrestQuery({ order: 'name; select' })).toThrow(BadRequestException);
    expect(() => toPostgrestQuery({ limit: '99999' })).toThrow(BadRequestException);
    expect(() => toPostgrestQuery({ status: ['a', 'b'] })).toThrow(BadRequestException);
  });
  it('encodes values so they cannot add PostgREST params', () => {
    expect(toPostgrestQuery({ name: 'a&role=eq.ADMIN' })).toContain('name=eq.a%26role%3Deq.ADMIN');
  });
});
