import Stripe from 'stripe';

// Make sure we have the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe with the secret key from environment variables
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.acacia', // Use the latest Stripe API version
  appInfo: {
    name: 'StealMySample Marketplace',
    version: '0.1.0',
  },
});

// Create a checkout session
export async function createCheckoutSession({
  customerId,
  lineItems,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId?: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

// Retrieve a checkout session
export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

// Create a Stripe customer
export async function createCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

// Retrieve a customer by ID
export async function getCustomer(customerId: string) {
  return stripe.customers.retrieve(customerId);
}

// List customer payment methods
export async function listPaymentMethods(customerId: string) {
  return stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
} 