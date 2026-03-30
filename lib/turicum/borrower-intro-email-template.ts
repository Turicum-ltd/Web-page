import "server-only";

import type { BorrowerIntroCallRequestRecord } from "@/lib/turicum/borrower-intro-requests";

export const BORROWER_INTRO_CONFIRMATION_SUBJECT =
  "Action Required: Confirm your Turicum Intro Call";

export interface BorrowerIntroConfirmationEmailInput {
  borrowerName: string;
  location: string;
  amount: string;
  bookingLink: string;
}

export interface BorrowerIntroConfirmationEmail {
  subject: string;
  text: string;
}

function requireTemplateValue(label: string, value: string | undefined) {
  const next = value?.trim() ?? "";

  if (!next) {
    throw new Error(`${label} is required to build the borrower intro confirmation email.`);
  }

  return next;
}

export function buildBorrowerIntroConfirmationEmail(
  input: BorrowerIntroConfirmationEmailInput
): BorrowerIntroConfirmationEmail {
  const borrowerName = requireTemplateValue("Borrower name", input.borrowerName);
  const location = requireTemplateValue("Location", input.location);
  const amount = requireTemplateValue("Amount", input.amount);
  const bookingLink = requireTemplateValue("Booking link", input.bookingLink);

  return {
    subject: BORROWER_INTRO_CONFIRMATION_SUBJECT,
    text: [
      `Hi ${borrowerName},`,
      "",
      `Thanks for reaching out about your project in ${location}. We’ve received your request for a 15-minute intro call regarding your $${amount} loan request.`,
      "",
      `To move forward, please pick a time that works for you here: ${bookingLink}`,
      "",
      "During this call, we’ll discuss the property and the loan structure to see if it’s a fit before opening your secure intake packet.",
      "",
      "Best,",
      "The Turicum Team"
    ].join("\n")
  };
}

export function buildBorrowerIntroConfirmationEmailFromRequest(
  request: Pick<BorrowerIntroCallRequestRecord, "fullName" | "assetLocation" | "requestedAmount">,
  bookingLink: string
): BorrowerIntroConfirmationEmail {
  return buildBorrowerIntroConfirmationEmail({
    borrowerName: request.fullName,
    location: request.assetLocation,
    amount: request.requestedAmount,
    bookingLink
  });
}
