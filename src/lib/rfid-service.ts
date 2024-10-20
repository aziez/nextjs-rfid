// lib/rfid-service.ts
import { SerialPort } from 'serialport';
import { RFIDTag, SerialPortInfo } from '@/types/rfid';

class RFIDService {
  private static instance: RFIDService;
  private port: SerialPort | null = null;
  private position: number = 1;
  private readonly PRESET_VALUE = 0xFFFF;
  private readonly POLYNOMIAL = 0x8408;

  private constructor() {}

  static getInstance(): RFIDService {
    if (!RFIDService.instance) {
      RFIDService.instance = new RFIDService();
    }
    return RFIDService.instance;
  }

  private calculateCRC(cmd: string): Buffer {
    const cmdBuffer = Buffer.from(cmd.replace(/\s/g, ''), 'hex');
    let uiCrcValue = this.PRESET_VALUE;

    for (let x = 0; x < cmdBuffer.length; x++) {
      uiCrcValue = uiCrcValue ^ cmdBuffer[x];
      for (let y = 0; y < 8; y++) {
        if (uiCrcValue & 0x0001) {
          uiCrcValue = (uiCrcValue >> 1) ^ this.POLYNOMIAL;
        } else {
          uiCrcValue = uiCrcValue >> 1;
        }
      }
    }

    const crc_H = (uiCrcValue >> 8) & 0xFF;
    const crc_L = uiCrcValue & 0xFF;
    
    return Buffer.concat([cmdBuffer, Buffer.from([crc_L, crc_H])]);
  }

  async listPorts(): Promise<SerialPortInfo[]> {
    return SerialPort.list();
  }

  async connect(portPath: string, position: number): Promise<void> {
    if (this.port) {
      await this.disconnect();
    }

    this.position = position;
    
    return new Promise((resolve, reject) => {
      this.port = new SerialPort({
        path: portPath,
        baudRate: 57600,
      }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.port) {
        resolve();
        return;
      }

      this.port.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        this.port = null;
        resolve();
      });
    });
  }

  async scan(): Promise<RFIDTag> {
    if (!this.port) {
      throw new Error('Port not connected');
    }

    const no_reader = 'FF';
    const INVENTORY1 = `06 ${no_reader} 01 00 06`;
    
    return new Promise((resolve, reject) => {
      const dataScan = this.calculateCRC(INVENTORY1);
      
      this.port!.write(dataScan, (err) => {
        if (err) {
          reject(err);
          return;
        }

        let responseData = Buffer.alloc(0);
        
        const timeout = setTimeout(() => {
          cleanup();
          resolve({
            uid: '',
            timestamp: new Date().toISOString(),
            status: 'not_detected',
            position: this.position
          });
        }, 100);

        const onData = (data: Buffer) => {
          responseData = Buffer.concat([responseData, data]);
        };

        const cleanup = () => {
          clearTimeout(timeout);
          this.port?.removeListener('data', onData);
        };

        this.port!.on('data', onData);

        setTimeout(() => {
          cleanup();
          
          const responseHex = responseData.toString('hex').toUpperCase();
          const hexList = responseHex.match(/.{1,2}/g) || [];
          const hexSpace = hexList.join(' ');
          const uid = hexSpace.slice(-6);
          const uid_str = uid.replace(/\s/g, '');

          if (hexSpace.includes('FB') || hexSpace.includes('FE') || hexSpace === '') {
            resolve({
              uid: '',
              timestamp: new Date().toISOString(),
              status: 'not_detected',
              position: this.position
            });
          } else {
            resolve({
              uid: uid_str,
              timestamp: new Date().toISOString(),
              status: 'success',
              position: this.position
            });
          }
        }, 100);
      });
    });
  }
}

export const rfidService = RFIDService.getInstance();