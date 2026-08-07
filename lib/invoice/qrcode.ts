import QRCode from 'qrcode';

export interface ZatcaQrData {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO 8601 string
  invoiceTotal: string; // e.g. "150.00"
  vatTotal: string; // e.g. "12.00"
}

/**
 * Encodes a string tag and value into TLV (Tag-Length-Value) format for GCC/ZATCA e-invoices.
 */
function toTLV(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, 'utf8');
  const lengthBuffer = Buffer.from([valueBuffer.length]);
  const tagBuffer = Buffer.from([tag]);
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

/**
 * Generates standard Base64 TLV string for GCC / Tax Authority compliant QR codes.
 */
export function generateZatcaTlvBase64(data: ZatcaQrData): string {
  const tag1 = toTLV(1, data.sellerName);
  const tag2 = toTLV(2, data.vatNumber);
  const tag3 = toTLV(3, data.timestamp);
  const tag4 = toTLV(4, data.invoiceTotal);
  const tag5 = toTLV(5, data.vatTotal);

  const tlvBuffer = Buffer.concat([tag1, tag2, tag3, tag4, tag5]);
  return tlvBuffer.toString('base64');
}

/**
 * Generates a QR Code as a Data URL (image/png) for rendering in HTML/PDF.
 */
export async function generateQrCodeDataUrl(content: string): Promise<string> {
  try {
    return await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#1A1A1A',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code DataURL:', error);
    return '';
  }
}

/**
 * Generates a QR Code as an inline SVG string.
 */
export async function generateQrCodeSvg(content: string): Promise<string> {
  try {
    return await QRCode.toString(content, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#1A1A1A',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    return '';
  }
}
