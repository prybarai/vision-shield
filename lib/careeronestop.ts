export interface LicenseCheckResult {
  status: 'active' | 'expired' | 'not_found' | 'error';
  licenseNumber?: string;
  licenseType?: string;
  expiresAt?: string;
  businessName?: string;
  boardName?: string;
  boardUrl?: string;
  rawData?: Record<string, unknown>;
  error?: string;
}

export async function checkContractorLicense(params: {
  name?: string;
  businessName?: string;
  licenseNumber?: string;
  state: string;
}): Promise<LicenseCheckResult> {
  const userId = process.env.CAREERONESTOP_USER_ID;
  const token = process.env.CAREERONESTOP_TOKEN;

  if (!userId || !token) {
    return { status: 'error', error: 'CareerOneStop API not configured' };
  }

  const keyword = params.licenseNumber || params.businessName || params.name || '';
  const url = `https://api.careeronestop.org/v1/licensecertification/${userId}/${encodeURIComponent(keyword)}/${params.state}/0/5`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return { status: 'error', error: `API returned ${response.status}` };

    const data = await response.json() as { LicenseCertificationList?: Array<Record<string, string>> };
    if (!data.LicenseCertificationList?.length) return { status: 'not_found' };

    const license = data.LicenseCertificationList[0];
    const isActive = license['LicenseStatusDescription']?.toLowerCase().includes('active');

    return {
      status: isActive ? 'active' : 'expired',
      licenseNumber: license['LicenseNumber'],
      licenseType: license['OnetTitle'],
      expiresAt: license['ExpirationDate'],
      boardName: license['AgencyName'],
      boardUrl: license['AgencyURL'],
      rawData: data as unknown as Record<string, unknown>,
    };
  } catch (error) {
    return { status: 'error', error: String(error) };
  }
}
