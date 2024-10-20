// app/api/rfid/connect/route.ts
import { RFIDReader } from '@/lib/rfid-reader';
import { NextResponse } from 'next/server';

let readerInstance: RFIDReader | null = null;

export async function POST(request: Request) {
  try {
    const { port, position } = await request.json();
    
    if (readerInstance) {
      await readerInstance.disconnect();
    }
    
    readerInstance = new RFIDReader(port, position);
    await readerInstance.connect();
    
    return NextResponse.json({
      success: true,
      data: { status: 'connected', port, position }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Failed to connect to RFID reader ${error}` },
      { status: 500 }
    );
  }
}
