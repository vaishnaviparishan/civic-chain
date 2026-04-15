import CryptoJS from "crypto-js";

export function generateCertificateHash(data: {
  name: string;
  certificateType: string;
  certificateId: string;
  issueDate: string;
}): string {
  const payload = `${data.name}|${data.certificateType}|${data.certificateId}|${data.issueDate}`;
  return CryptoJS.SHA256(payload).toString();
}
