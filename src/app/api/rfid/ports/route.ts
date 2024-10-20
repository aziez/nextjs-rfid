// app/api/rfid/ports/route.ts
import { NextResponse } from 'next/server';
import { rfidService } from '@/lib/rfid-service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ports = await rfidService.listPorts();
    return NextResponse.json({ success: true, data: ports });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to list serial ports' },
      { status: 500 }
    );
  }
}
