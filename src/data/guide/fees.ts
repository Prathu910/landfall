import type { Visa } from "../../lib/data/types";
import type {
  Fee,
  FeeAmount,
  FeeCatalogue,
  VisaCharges,
} from "../../lib/guide/types";

// Hand-sourced from the official pages on 23 Nov 2026; the research notes are
// docs/research/pr-guide-2026-11.md. Fees change (visa charges every 1 July):
// re-read each source and update `checkedAt` together with the amount.
const CHECKED = "2026-11-23";
const PRICING =
  "https://immi.homeaffairs.gov.au/visas/getting-a-visa/fees-and-charges/current-visa-pricing";

const aud = (amount: number): FeeAmount => ({
  kind: "fixed",
  currency: "AUD",
  amount,
});
const audRange = (min: number, max: number): FeeAmount => ({
  kind: "range",
  currency: "AUD",
  min,
  max,
});
const check = (reason: string): FeeAmount => ({ kind: "check", reason });

function charges(
  visa: Visa,
  main: number,
  adult: number,
  child: number,
  secondInstalment: number,
): VisaCharges {
  const fee = (id: string, label: string, amount: number): Fee => ({
    id: `vac-${visa}-${id}`,
    label,
    amount: aud(amount),
    source: PRICING,
    checkedAt: CHECKED,
  });
  return {
    visa,
    main: fee("main", "Visa application charge, main applicant", main),
    adult: fee("adult", "Each extra applicant aged 18 or over", adult),
    child: fee("child", "Each extra applicant under 18", child),
    secondInstalment: fee(
      "second",
      "Second instalment, each adult assessed without functional English",
      secondInstalment,
    ),
  };
}

const BLOCKED = "The official page refused our automated read on 23 Nov 2026.";

export const FEES: FeeCatalogue = {
  feesAsAt: "2026-07-01",
  visaCharges: {
    "189": charges("189", 6135, 3070, 1540, 4885),
    "190": charges("190", 6140, 3070, 1535, 4885),
    "491": charges("491", 6140, 3070, 1535, 4890),
  },
  assessingBodies: [
    {
      id: "acs",
      label: "ACS (ICT occupations)",
      amount: audRange(1136, 1498),
      tax: "Excludes GST",
      note: "Post Australian Study to General Skills pathway.",
      source: "https://www.acs.org.au/msa/infohub/fees-and-payment.html",
      checkedAt: CHECKED,
      changes: [
        {
          from: "2027-01-05",
          amount: audRange(1176, 1551),
          note: "ACS's published fees from 5 Jan 2027.",
        },
      ],
    },
    {
      id: "ea",
      label: "Engineers Australia",
      amount: audRange(505, 1034),
      tax: "AUD 505–940 excluding GST, 555.50–1,034 including GST",
      note: "Accord qualification assessment to a standard Competency Demonstration Report; adding a skilled employment assessment costs more.",
      source:
        "https://www.engineersaustralia.org.au/migrants/migration-skills-assessment/assessment-fees-and-additional-services",
      checkedAt: CHECKED,
    },
    {
      id: "anmac",
      label: "ANMAC (nurses and midwives)",
      amount: audRange(395, 595),
      tax: "No GST",
      note: "Modified to Full skills assessment. ANMAC says new fees and assessment names take effect by the end of 2026.",
      source: "https://www.anmac.org.au/skilled-migrants/fees",
      checkedAt: CHECKED,
    },
    {
      id: "vetassess",
      label: "VETASSESS (professional occupations)",
      amount: { offshore: aud(1146), onshore: aud(1260.6) },
      tax: "GST is added for Australian tax residents",
      note: "Full skills assessment; priority processing costs extra.",
      source:
        "https://www.vetassess.com.au/skills-assessment-for-migration/professional-occupations/skills-assessment-fees-for-professional-occupations",
      checkedAt: CHECKED,
    },
    {
      id: "tra",
      label: "Trades Recognition Australia (trades)",
      amount: check(
        "Our automated read of the TRA site failed on 23 Nov 2026, and its fees depend on the assessment pathway.",
      ),
      source: "https://www.tradesrecognitionaustralia.gov.au/",
      checkedAt: CHECKED,
    },
    {
      id: "cpa",
      label: "CPA Australia (accountants)",
      amount: { offshore: aud(514), onshore: aud(565) },
      note: "Qualification assessment.",
      source:
        "https://www.cpaaustralia.com.au/migration-services/migration-to-australia/how-to-apply-for-a-migration-skill-assessment",
      checkedAt: CHECKED,
    },
    {
      id: "caanz",
      label: "CA ANZ (accountants)",
      amount: check(BLOCKED),
      source:
        "https://www.charteredaccountantsanz.com/become-a-member/migration-assessment/fees-and-processing-times",
      checkedAt: CHECKED,
    },
    {
      id: "ipa",
      label: "IPA (accountants)",
      amount: aud(595),
      note: "Qualification assessment, standard service.",
      source: "https://www.publicaccountants.org.au/migration-assessments",
      checkedAt: CHECKED,
    },
    {
      id: "aitsl",
      label: "AITSL (school teachers)",
      amount: aud(1198),
      tax: "No GST",
      note: "Effective 7 Sep 2026.",
      source:
        "https://www.aitsl.edu.au/teacher-migration-services/skills-assessments/fees",
      checkedAt: CHECKED,
    },
  ],
  englishTests: [
    {
      id: "pte",
      label: "PTE Academic",
      amount: check(
        "Pearson shows prices only in its price finder, which we could not read.",
      ),
      source: "https://www.pearsonpte.com/test-centers-and-fees",
      checkedAt: CHECKED,
    },
    {
      id: "ielts-india",
      label: "IELTS, booked in India (IDP)",
      amount: { kind: "fixed", currency: "INR", amount: 19000 },
      note: "Academic or General Training. IDP India says the fee changes on 1 Jan 2027.",
      source: "https://ieltsidpindia.com/information/ielts-test-fee",
      checkedAt: CHECKED,
      changes: [
        {
          from: "2027-01-01",
          amount: check(
            "IDP India said the fee changes on 1 Jan 2027 but had not published the new fee when we checked.",
          ),
        },
      ],
    },
    {
      id: "ielts-australia",
      label: "IELTS, booked in Australia",
      amount: check("We did not read an official Australian IELTS fee page."),
      source: "https://ielts.com.au/",
      checkedAt: CHECKED,
    },
  ],
  naati: {
    id: "naati",
    label: "NAATI Credentialed Community Language test",
    amount: check("NAATI's site was in maintenance mode on 23 Nov 2026."),
    source: "https://www.naati.com.au/ccl/",
    checkedAt: CHECKED,
  },
  stateNomination: {
    NSW: {
      id: "nom-nsw",
      label: "NSW nomination",
      amount: check("No fee is stated on the NSW 190 or 491 pages we read."),
      source:
        "https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190",
      checkedAt: CHECKED,
    },
    VIC: {
      id: "nom-vic",
      label: "Victoria nomination",
      amount: check(BLOCKED),
      source:
        "https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/fees",
      checkedAt: CHECKED,
    },
    QLD: {
      id: "nom-qld",
      label: "Queensland nomination",
      amount: { offshore: aud(573), onshore: aud(630.3) },
      tax: "GST is added for onshore applicants",
      source:
        "https://www.migration.qld.gov.au/nomination-process/application-process/application-fees",
      checkedAt: CHECKED,
    },
    WA: {
      id: "nom-wa",
      label: "Western Australia nomination",
      amount: aud(200),
      note: "Non-refundable application fee.",
      source:
        "https://migration.wa.gov.au/sites/default/files/2026-11/SNMP%20Criteria%2026-27.pdf",
      checkedAt: CHECKED,
    },
    SA: {
      id: "nom-sa",
      label: "South Australia nomination",
      amount: aud(394),
      note: "Registration of Interest: nil.",
      source:
        "https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants",
      checkedAt: CHECKED,
    },
    ACT: {
      id: "nom-act",
      label: "ACT nomination",
      amount: check(BLOCKED),
      source: "https://www.act.gov.au/migration/skilled-migrants",
      checkedAt: CHECKED,
    },
    TAS: {
      id: "nom-tas",
      label: "Tasmania nomination",
      amount: check(BLOCKED),
      source: "https://www.migration.tas.gov.au/skilled_migration",
      checkedAt: CHECKED,
    },
    NT: {
      id: "nom-nt",
      label: "Northern Territory nomination",
      amount: check(BLOCKED),
      source:
        "https://theterritory.com.au/migrate/migrate-to-work/northern-territory-government-visa-nomination",
      checkedAt: CHECKED,
    },
  },
  afpCheck: {
    id: "afp",
    label: "Australian police check (AFP), each adult",
    amount: aud(57),
    note: "Needed after 12 months or more in Australia in the last 10 years since turning 16.",
    source: "https://www.afp.gov.au/our-services/national-police-checks",
    checkedAt: CHECKED,
  },
  overseasPolice: {
    id: "overseas-police",
    label: "Overseas police certificates",
    amount: {
      kind: "varies",
      reason:
        "Each country sets its own fee; India's Passport Seva fee calculator gives the Indian one.",
    },
    source: "https://www.passportindia.gov.in/psp/feeCalculator",
    checkedAt: CHECKED,
  },
  health: {
    id: "health",
    label: "Health examinations",
    amount: {
      kind: "varies",
      reason: "Panel clinics set their own prices; Home Affairs lists none.",
    },
    source:
      "https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/health",
    checkedAt: CHECKED,
  },
  translations: {
    id: "translations",
    label: "Translations of documents not in English",
    amount: {
      kind: "varies",
      reason: "Priced per document by the translator.",
    },
    source:
      "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested",
    checkedAt: CHECKED,
  },
};
