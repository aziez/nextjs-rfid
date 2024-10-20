// app/api/rfid/disconnect/route.ts

import { NextResponse } from 'next/server';
import { RFIDReader } from '@/lib/rfid-reader';

let readerInstance: RFIDReader | null = null;

export async function POST() {
  try {
    if (readerInstance) {
      await readerInstance.disconnect();
      readerInstance = null;
    }
    
    return NextResponse.json({
      success: true,
      data: { status: 'disconnected' }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Failed to disconnect RFID reader ${error}` },
      { status: 500 }
    );
  }
}