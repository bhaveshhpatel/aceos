/**
 * Payments provider abstraction.
 * Import and call this — never import Stripe directly in app code.
 * Stub — implement when billing is added in Phase 2.
 */
export async function createCheckoutSession(_options: {
  customerId: string;
  priceId:    string;
  successUrl: string;
  cancelUrl:  string;
}): Promise<{ url: string | null; error?: string }> {
  // TODO: implement at Phase 2 billing sprint
  return { url: null, error: 'Payments not yet implemented' };
}
