import { NextResponse } from 'next/server';
import { getServerState, setServerState } from '@/lib/server-db';
import { KagazState } from '@/lib/schema';

export async function GET() {
  const state = getServerState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const newState = (await request.json()) as KagazState;
    setServerState(newState);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error saving state:', error);
    return NextResponse.json({ success: false, error: 'Invalid state payload' }, { status: 400 });
  }
}
