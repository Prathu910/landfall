import { calculatePoints, type Profile } from "./migration";

/**
 * The check form's answer for one step (0 profile, 1 English and study,
 * 2 work and details): the first problem, or null when the step is complete.
 * /check/ runs it per step; "Edit answers" on /report/ runs all three.
 */
export function stepError(
  step: number,
  profile: Profile,
  asOf: string,
): string | null {
  if (step === 0) {
    const missing = calculatePoints(profile, asOf).missing;
    if (!profile.dob || missing.includes("Date of birth"))
      return "Enter a valid date of birth, on or before today.";
    if (!profile.occupation)
      return "Choose your occupation, or select points check only.";
  }
  if (step === 1) {
    if (profile.english === "unknown" || profile.qualification === "unknown")
      return "Choose your English level and highest qualification.";
    if (profile.englishDate > asOf)
      return "Your English test date cannot be in the future.";
  }
  if (step === 2) {
    if (profile.partner === "unknown")
      return "Choose the partner category that describes you.";
    if (
      profile.assessmentDate > asOf ||
      profile.eoiDate > asOf ||
      (profile.professionalYear && profile.professionalYearDate > asOf)
    )
      return "Assessment, EOI and completion dates cannot be in the future.";
  }
  return null;
}

/** The first problem across the three answer steps, or null. */
export function answersError(profile: Profile, asOf: string): string | null {
  for (const step of [0, 1, 2]) {
    const error = stepError(step, profile, asOf);
    if (error) return error;
  }
  return null;
}
