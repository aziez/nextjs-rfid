// types/rfid.ts
export interface RFIDTag {
  uid: string;
  timestamp: string;
  status: 'success' | 'not_detected' | 'error';
  position?: number;
}

export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  vendorId?: string;
  productId?: string;
}

export interface ReaderStatus {
  isConnected: boolean;
  selectedPort: string;
  position: number;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastError?: string;
}

export interface RFIDCommand {
  type: 'inventory' | 'read' | 'write';
  data?: string;
}