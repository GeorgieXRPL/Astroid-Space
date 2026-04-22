/**
 * @fileoverview POST /api/admin/logout - clears the admin session cookie.
 */

import { NextResponse } from 'next/server';
import { logout } from '../../../lib/adminAuth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  logout(res);
  return res;
}
