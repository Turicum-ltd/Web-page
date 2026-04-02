import "server-only";

export const BORROWER_APPLICATION_ACCESS_SUBJECT = "Your Turicum Application Access";

export interface BorrowerApplicationAccessEmailInput {
  borrowerName: string;
  applicationUrl: string;
}

export interface BorrowerApplicationAccessEmail {
  subject: string;
  text: string;
}

function requireTemplateValue(label: string, value: string | undefined) {
  const next = value?.trim() ?? "";

  if (!next) {
    throw new Error(`${label} is required to build the borrower application access email.`);
  }

  return next;
}

export function buildBorrowerApplicationAccessEmail(
  input: BorrowerApplicationAccessEmailInput
): BorrowerApplicationAccessEmail {
  const borrowerName = requireTemplateValue("Borrower name", input.borrowerName);
  const applicationUrl = requireTemplateValue("Application URL", input.applicationUrl);

  return {
    subject: BORROWER_APPLICATION_ACCESS_SUBJECT,
    text: [
      `Hi ${borrowerName},`,
      "",
      "Thanks again for speaking with Turicum.",
      "",
      "Your secure application access is now ready. Use the link below to log in and complete the full borrower application:",
      applicationUrl,
      "",
      "Once inside, you can review the intake packet, complete the required fields, and submit the application directly to our team.",
      "",
      "If you have any trouble accessing the packet, reply to this email and we will help right away.",
      "",
      "Best,",
      "The Turicum Team"
    ].join("\n")
  };
}
