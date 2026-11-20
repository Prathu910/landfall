import { validEmail } from "@/lib/submissions/contract";
export function PrivacyContact() {
  const contact = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "";
  return validEmail(contact) ? (
    <p>
      For questions about your information or a deletion request, contact{" "}
      <a href={`mailto:${contact}`}>{contact}</a>. Clearing answers on your
      device does not delete records already submitted to us.
    </p>
  ) : (
    <p>
      Privacy contact details will be published here before personal report
      submissions open. Clearing your device only removes the answers saved in
      this browser.
    </p>
  );
}
