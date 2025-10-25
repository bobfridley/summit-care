// src/api/_utils/http.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

type JsonObj = Record<string, unknown> | unknown[];

// Always return a NextResponse so handlers have a single return type.
export function ok<T extends JsonObj>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function err(message: string, status = 500, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function fromError(e: unknown, fallbackStatus = 500) {
  if (e instanceof ZodError) {
    return err('Validation failed', 400, { issues: e.issues });
  }
  if (e instanceof Error) {
    return err(e.message, fallbackStatus);
  }
  return err('Unknown error', fallbackStatus);
}
