import { getCertificateInfo } from "sslko";

export interface SSLInfoInterface {
  domain: string;
  valid: boolean;
  expired: boolean;
  daysLeft: number;
  validFrom: Date;
  validTo: Date;
  issuer?: string;
  error?: string;
}

export async function checkSSL(domain: string): Promise<SSLInfoInterface> {
  try {
    // Clean URL from protocol and paths
    const hostname = domain.replace(/^https?:\/\//, "").split("/")?.[0] ?? "";

    const certInfo = await getCertificateInfo(hostname, { timeout: 10000 });

    return {
      domain: hostname,
      valid: certInfo.valid,
      expired: certInfo.expired,
      daysLeft: certInfo.daysLeft,
      validFrom: new Date(certInfo.validFromDate),
      validTo: new Date(certInfo.validToDate),
      issuer: certInfo.issuer?.O?.toString(),
      error: certInfo.errors?.join(", "),
    };
  } catch (error: any) {
    return {
      domain,
      valid: false,
      expired: true,
      daysLeft: 0,
      validFrom: new Date(),
      validTo: new Date(),
      error: error.message,
    };
  }
}
