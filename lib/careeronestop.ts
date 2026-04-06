import { getStateBoardInfo } from '@/lib/stateBoards';

export interface LicenseCheckResult {
  status: 'active' | 'expired' | 'not_found' | 'fallback' | 'error';
  licenseNumber?: string;
  licenseType?: string;
  expiresAt?: string;
  businessName?: string;
  boardName?: string;
  boardUrl?: string;
  verificationMethod?: 'careeronestop' | 'state_board_fallback';
  fallbackMessage?: string;
  rawData?: Record<string, unknown>;
  error?: string;
}

function buildFallback(state: string, reason?: string): LicenseCheckResult {
  const board = getStateBoardInfo(state);

  if (!board) {
    return {
      status: 'error',
      error: reason || 'No verification source available for this state.',
    };
  }

  return {
    status: 'fallback',
    boardName: board.boardName,
    boardUrl: board.verifyUrl,
    verificationMethod: 'state_board_fallback',
    fallbackMessage: `We couldn't automatically verify this license. Check directly with the ${board.state} board.`,
    error: reason,
  };
}

export async function checkContractorLicense(params: {
  name?: string;
  businessName?: string;
  licenseNumber?: string;
  state: string;
}): Promise<LicenseCheckResult> {
  const userId = process.env.CAREERONESTOP_USER_ID;
  const token = process.env.CAREERONESTOP_TOKEN;

  const keyword = (params.licenseNumber || params.businessName || params.name || '').trim();
  if (!keyword) {
    return buildFallback(params.state, 'Business name or license number is required for automatic verification.');
  }

  if (!userId || !token) {
    return buildFallback(params.state, 'CareerOneStop API not configured.');
  }

  const url = `https://api.careeronestop.org/v1/licensecertification/${userId}/${encodeURIComponent(keyword)}/${params.state}/0/5`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return buildFallback(params.state, `CareerOneStop returned ${response.status}.`);
    }

    const data = await response.json() as { LicenseCertificationList?: Array<Record<string, string>> };
    const licenses = data.LicenseCertificationList ?? [];
    const board = getStateBoardInfo(params.state);

    if (!licenses.length) {
      return buildFallback(params.state, 'No automatic license record was found.');
    }

    const license = licenses.find((item) => {
      const haystack = [
        item['OrganizationName'],
        item['LicenseHolderName'],
        item['BusinessName'],
        item['LicenseNumber'],
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(keyword.toLowerCase());
    }) ?? licenses[0];

    const statusText = (license['LicenseStatusDescription'] || '').toLowerCase();
    const hasMeaningfulIdentity = Boolean(
      license['LicenseNumber'] || license['OrganizationName'] || license['LicenseHolderName'] || license['BusinessName']
    );

    if (!hasMeaningfulIdentity) {
      return buildFallback(params.state, 'Automatic verification returned incomplete data.');
    }

    return {
      status: statusText.includes('active') ? 'active' : 'expired',
      licenseNumber: license['LicenseNumber'],
      licenseType: license['OnetTitle'] || license['LicenseName'],
      expiresAt: license['ExpirationDate'],
      businessName: license['OrganizationName'] || license['BusinessName'] || license['LicenseHolderName'],
      boardName: license['AgencyName'] || board?.boardName,
      boardUrl: license['AgencyURL'] || board?.verifyUrl,
      verificationMethod: 'careeronestop',
      rawData: data as unknown as Record<string, unknown>,
    };
  } catch (error) {
    return buildFallback(params.state, String(error));
  }
}
