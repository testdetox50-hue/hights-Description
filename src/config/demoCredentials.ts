export const DEMO_EMAIL = "Nirontech@yopmail.com";
export const DEMO_PASSWORD = "admin@123";
export const DEMO_FULL_NAME = "Niron Tech Admin";

export function isDemoEmail(email: string) {
  return email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase();
}
