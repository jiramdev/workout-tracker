export const MIN_PASSWORD_LENGTH = 8;

export function passwordRuleError(password: string, label = "Het wachtwoord") {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `${label} moet minstens 8 tekens zijn.`;
  }
  return null;
}
