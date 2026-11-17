export const DASHBOARD_ORIGIN = "https://api.dynamic.reports.employment.gov.au";
export const DASHBOARD_PAGE_URL = `${DASHBOARD_ORIGIN}/anonap/extensions/hSKLS02_SkillSelect_EOI_Data/hSKLS02_SkillSelect_EOI_Data.html`;
export const QLIK_APP_ID = "aaac76b5-ad30-477e-9ca0-472f8ab57fc8";
export const QLIK_WEBSOCKET_URL = `wss://api.dynamic.reports.employment.gov.au/anonap/app/${QLIK_APP_ID}`;
export const QLIK_BOOKMARK_ID = "44604edb-b94c-414b-b978-30bb79019ffd";
export const QLIK_TABLE_OBJECT = "eymDb";

export const VISA_NAMES = {
  "189": "189PTS Points-Tested Stream",
  "190": "190SAS Skilled Australian Sponsored",
  "491": "491SNR State or Territory Nominated - Regional",
} as const;
