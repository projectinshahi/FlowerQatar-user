import { NextResponse } from 'next/server';
import { getNavMenu } from '@/lib/subcategories';

export async function GET() {
  const menu = await getNavMenu();
  return NextResponse.json(menu);
}
