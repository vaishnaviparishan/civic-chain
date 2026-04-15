import CryptoJS from "crypto-js";

export function generateCertificateHash(data: {
  userId: string;
  certificateId: string;
  timestamp: string;
}): string {
  const payload = `${data.userId}|${data.certificateId}|${data.timestamp}`;
  return CryptoJS.SHA256(payload).toString();
}
