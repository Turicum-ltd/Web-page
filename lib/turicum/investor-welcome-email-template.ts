import "server-only";

export const INVESTOR_WELCOME_SUBJECT = "Welcome to the Turicum Investor Portal";
const INVESTOR_PORTAL_URL = "https://turicum.us/investors";

export interface InvestorWelcomeEmailInput {
  fullName: string;
}

export interface InvestorWelcomeEmail {
  subject: string;
  text: string;
}

function requireTemplateValue(label: string, value: string | undefined) {
  const next = value?.trim() ?? "";

  if (!next) {
    throw new Error(`${label} is required to build the investor welcome email.`);
  }

  return next;
}

export function buildInvestorWelcomeEmail(
  input: InvestorWelcomeEmailInput
): InvestorWelcomeEmail {
  const fullName = requireTemplateValue("Full name", input.fullName);

  return {
    subject: INVESTOR_WELCOME_SUBJECT,
    text: [
      `Welcome, ${fullName}.`,
      "",
      `Your portal access is now active. You can log in at ${INVESTOR_PORTAL_URL} using this email address and the temporary password provided to you.`,
      "",
      "Inside the portal, you will find:",
      "1. Promoted Case Flow: Review active first-lien opportunities cleared by our team.",
      "2. Monthly Servicing: Access real-time updates on interest payments and principal recovery.",
      "3. Resolution Paths: Track the specific exit strategy for each asset in your portfolio.",
      "",
      "Our goal is total transparency. If you have questions about a specific promoted matter, use the 'Inquiry' button directly within the case view.",
      "",
      "Best regards,",
      "The Turicum Team"
    ].join("\n")
  };
}
