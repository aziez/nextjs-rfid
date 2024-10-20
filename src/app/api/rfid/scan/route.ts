
// app/api/rfid/scan/route.ts

import { NextResponse } from 'next/server';
import { RFIDReader } from '@/lib/rfid-reader';

const readerInstance: RFIDReader | null = null;


export async function GET() {
  try {
    if (!readerInstance) {
      throw new Error('Reader not connected');
    }
    
    const tag = await readerInstance.scan();
    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Failed to scan RFID tag ${error}` },
      { status: 500 }
    );
  }
}
