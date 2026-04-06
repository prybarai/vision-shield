export interface StateBoardInfo {
  code: string;
  state: string;
  boardName: string;
  verifyUrl: string;
}

export const STATE_BOARDS: Record<string, StateBoardInfo> = {
  AL: { code: 'AL', state: 'Alabama', boardName: 'Alabama Licensing Board for General Contractors', verifyUrl: 'https://genconbd.alabama.gov/consumer.aspx' },
  AK: { code: 'AK', state: 'Alaska', boardName: 'Alaska Department of Commerce, Community, and Economic Development', verifyUrl: 'https://www.commerce.alaska.gov/cbp/main/Search/Professional' },
  AZ: { code: 'AZ', state: 'Arizona', boardName: 'Arizona Registrar of Contractors', verifyUrl: 'https://roc.az.gov/contractor-search' },
  AR: { code: 'AR', state: 'Arkansas', boardName: 'Arkansas Contractors Licensing Board', verifyUrl: 'https://aclb2.arkansas.gov/clbsearch.php' },
  CA: { code: 'CA', state: 'California', boardName: 'California Contractors State License Board', verifyUrl: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx' },
  CO: { code: 'CO', state: 'Colorado', boardName: 'Colorado Department of Regulatory Agencies', verifyUrl: 'https://apps2.colorado.gov/dora/licensing/lookup/licenselookup.aspx' },
  CT: { code: 'CT', state: 'Connecticut', boardName: 'Connecticut eLicense', verifyUrl: 'https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx' },
  DE: { code: 'DE', state: 'Delaware', boardName: 'Delaware Division of Professional Regulation', verifyUrl: 'https://dpronline.delaware.gov/mylicense%20weblookup/Search.aspx?facility=Y' },
  FL: { code: 'FL', state: 'Florida', boardName: 'Florida Department of Business and Professional Regulation', verifyUrl: 'https://www.myfloridalicense.com/wl11.asp' },
  GA: { code: 'GA', state: 'Georgia', boardName: 'Georgia Secretary of State Licensing Division', verifyUrl: 'https://verify.sos.ga.gov/verification/' },
  HI: { code: 'HI', state: 'Hawaii', boardName: 'Hawaii Professional and Vocational Licensing Division', verifyUrl: 'https://mypvl.dcca.hawaii.gov/public-license-search/' },
  ID: { code: 'ID', state: 'Idaho', boardName: 'Idaho Division of Occupational and Professional Licenses', verifyUrl: 'https://apps.dopl.idaho.gov/DOPLPublic/LPRBrowser.aspx' },
  IL: { code: 'IL', state: 'Illinois', boardName: 'Illinois Department of Financial and Professional Regulation', verifyUrl: 'https://online-dfpr.micropact.com/lookup/licenselookup.aspx' },
  IN: { code: 'IN', state: 'Indiana', boardName: 'Indiana Professional Licensing Agency', verifyUrl: 'https://mylicense.in.gov/everification/' },
  IA: { code: 'IA', state: 'Iowa', boardName: 'Iowa Division of Labor Contractor Registration', verifyUrl: 'https://contractor.iowa.gov/IaIWDCLB/CLB.Public.Web/ContractorSearch.aspx' },
  KS: { code: 'KS', state: 'Kansas', boardName: 'Kansas Attorney General Contractor Search', verifyUrl: 'https://www.ag.ks.gov/licensing/roofer-search' },
  KY: { code: 'KY', state: 'Kentucky', boardName: 'Kentucky Department of Housing, Buildings and Construction', verifyUrl: 'https://dhbc.ky.gov/Documents/HBC%20License%20Search.pdf' },
  LA: { code: 'LA', state: 'Louisiana', boardName: 'Louisiana State Licensing Board for Contractors', verifyUrl: 'https://lslbc.louisiana.gov/contractor-search/' },
  ME: { code: 'ME', state: 'Maine', boardName: 'Maine Professional and Financial Regulation', verifyUrl: 'https://www.pfr.maine.gov/ALMSOnline/ALMSQuery/SearchIndividual.aspx' },
  MD: { code: 'MD', state: 'Maryland', boardName: 'Maryland Home Improvement Commission', verifyUrl: 'https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi?calling_app=HIC::HIC_qselect' },
  MA: { code: 'MA', state: 'Massachusetts', boardName: 'Massachusetts Division of Occupational Licensure', verifyUrl: 'https://elicensing.mass.gov/CitizenAccess/GeneralProperty/PropertyLookUp.aspx?isLicensee=Y' },
  MI: { code: 'MI', state: 'Michigan', boardName: 'Michigan Department of Licensing and Regulatory Affairs', verifyUrl: 'https://aca-prod.accela.com/MILARA/GeneralProperty/PropertyLookUp.aspx?isLicensee=Y' },
  MN: { code: 'MN', state: 'Minnesota', boardName: 'Minnesota Department of Labor and Industry', verifyUrl: 'https://secure.doli.state.mn.us/lookup/licensing.aspx' },
  MS: { code: 'MS', state: 'Mississippi', boardName: 'Mississippi State Board of Contractors', verifyUrl: 'https://www.msboc.us/secure/contractor-search/' },
  MO: { code: 'MO', state: 'Missouri', boardName: 'Missouri Division of Professional Registration', verifyUrl: 'https://pr.mo.gov/licensee-search.asp' },
  MT: { code: 'MT', state: 'Montana', boardName: 'Montana Department of Labor & Industry', verifyUrl: 'https://ebiz.mt.gov/pol/' },
  NE: { code: 'NE', state: 'Nebraska', boardName: 'Nebraska Department of Labor Contractor Registration', verifyUrl: 'https://dol.nebraska.gov/conreg/Search' },
  NV: { code: 'NV', state: 'Nevada', boardName: 'Nevada State Contractors Board', verifyUrl: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorLicenseLookup/' },
  NH: { code: 'NH', state: 'New Hampshire', boardName: 'New Hampshire Office of Professional Licensure and Certification', verifyUrl: 'https://www.oplc.nh.gov/license-verification-and-rosters' },
  NJ: { code: 'NJ', state: 'New Jersey', boardName: 'New Jersey Division of Consumer Affairs', verifyUrl: 'https://newjersey.mylicense.com/verification/' },
  NM: { code: 'NM', state: 'New Mexico', boardName: 'New Mexico Regulation and Licensing Department', verifyUrl: 'https://verify.rld.state.nm.us/' },
  NY: { code: 'NY', state: 'New York', boardName: 'New York Department of State Licensee Search', verifyUrl: 'https://appext20.dos.ny.gov/lcns_public/bus_name_frm' },
  NC: { code: 'NC', state: 'North Carolina', boardName: 'North Carolina Licensing Board for General Contractors', verifyUrl: 'https://nclbgc.org/license-search/' },
  ND: { code: 'ND', state: 'North Dakota', boardName: 'North Dakota Secretary of State Contractor Search', verifyUrl: 'https://firststop.sos.nd.gov/search/business' },
  OH: { code: 'OH', state: 'Ohio', boardName: 'Ohio eLicense Center', verifyUrl: 'https://elicense.ohio.gov/OH_HomePage' },
  OK: { code: 'OK', state: 'Oklahoma', boardName: 'Oklahoma Construction Industries Board', verifyUrl: 'https://cibverify.ok.gov/' },
  OR: { code: 'OR', state: 'Oregon', boardName: 'Oregon Construction Contractors Board', verifyUrl: 'https://search.ccb.state.or.us/' },
  PA: { code: 'PA', state: 'Pennsylvania', boardName: 'Pennsylvania Attorney General Home Improvement Contractor Search', verifyUrl: 'https://hicsearch.attorneygeneral.gov/' },
  RI: { code: 'RI', state: 'Rhode Island', boardName: 'Rhode Island Contractors Registration and Licensing Board', verifyUrl: 'https://crb.ri.gov/contractor-search' },
  SC: { code: 'SC', state: 'South Carolina', boardName: 'South Carolina Labor Licensing Regulation', verifyUrl: 'https://verify.llronline.com/LicLookup/Contractors/Contractor.aspx?div=17' },
  SD: { code: 'SD', state: 'South Dakota', boardName: 'South Dakota Secretary of State', verifyUrl: 'https://sosenterprise.sd.gov/BusinessServices/Business/FilingSearch.aspx' },
  TN: { code: 'TN', state: 'Tennessee', boardName: 'Tennessee Department of Commerce & Insurance', verifyUrl: 'https://verify.tn.gov/' },
  TX: { code: 'TX', state: 'Texas', boardName: 'Texas Department of Licensing and Regulation', verifyUrl: 'https://www.tdlr.texas.gov/verify.htm' },
  UT: { code: 'UT', state: 'Utah', boardName: 'Utah Division of Professional Licensing', verifyUrl: 'https://secure.utah.gov/llv/search/index.html' },
  VT: { code: 'VT', state: 'Vermont', boardName: 'Vermont Office of Professional Regulation', verifyUrl: 'https://secure.professionals.vermont.gov/prweb/PRServletCustom/app%2FVTOPR%2F_/!STANDARD' },
  VA: { code: 'VA', state: 'Virginia', boardName: 'Virginia Department of Professional and Occupational Regulation', verifyUrl: 'https://www.dpor.virginia.gov/LicenseLookup' },
  WA: { code: 'WA', state: 'Washington', boardName: 'Washington Labor & Industries Verify a Contractor', verifyUrl: 'https://secure.lni.wa.gov/verify/' },
  WV: { code: 'WV', state: 'West Virginia', boardName: 'West Virginia Contractor Licensing Board', verifyUrl: 'https://labor.wv.gov/Licensing/Contractor_License/Pages/default.aspx' },
  WI: { code: 'WI', state: 'Wisconsin', boardName: 'Wisconsin Department of Safety and Professional Services', verifyUrl: 'https://licensesearch.wi.gov/' },
  WY: { code: 'WY', state: 'Wyoming', boardName: 'Wyoming Secretary of State Business Search', verifyUrl: 'https://wyobiz.wyo.gov/Business/FilingSearch.aspx' },
};

export function getStateBoardInfo(stateCode: string): StateBoardInfo | null {
  return STATE_BOARDS[stateCode.toUpperCase()] ?? null;
}
