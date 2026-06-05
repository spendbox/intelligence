// Paystack integration — intentionally a stub for v1.
// When the user is ready to enable paid plans, wire these up against
// https://paystack.com/docs/api/. The interface below is the contract the
// rest of the app should depend on so the swap is contained.

export interface PaystackClient {
  initSubscription(opts: { email: string; planCode: string; callbackUrl: string }): Promise<{
    authorizationUrl: string;
    reference: string;
  }>;
  verifyTransaction(reference: string): Promise<{
    status: "success" | "failed" | "pending";
    customerCode?: string;
  }>;
}

export function paystack(): PaystackClient {
  throw new Error("Paystack is not enabled yet. Wire this up when paid plans go live.");
}
