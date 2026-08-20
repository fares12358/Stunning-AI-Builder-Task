/**
 * Semantic knowledge for each supported dummy integration.
 *
 * `description` — full semantic context injected into the AI's system prompt so it understands
 *                  what the integration is, what it's for, and how it should shape the architecture.
 *
 * Integration names here must match the SUPPORTED_INTEGRATIONS list in chat.validation.js exactly.
 */
export const INTEGRATION_KNOWLEDGE = {
  Stripe: {
    description: `Stripe — payment processing and billing
What it is: a payment platform for handling one-time payments, subscriptions, invoicing, and checkout.
Typical use: charging customers, running subscription billing, generating invoices, handling refunds.
Architectural impact: requires a backend-driven checkout/payment flow — the client never handles raw card data directly.
Backend/API responsibilities: create Checkout Sessions or PaymentIntents server-side, verify webhook signatures, update order/subscription state when webhook events arrive (e.g. payment_succeeded, invoice.paid, subscription.updated).
Data flow: Frontend requests checkout -> Backend creates a Stripe session using the secret key -> user completes payment on Stripe -> Stripe sends a webhook to the backend -> backend updates internal order/subscription records.
Security: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET stay server-side only; only a publishable key may reach the client; always verify webhook signatures before trusting a payment event.`,
  },

  Shopify: {
    description: `Shopify — e-commerce platform integration
What it is: a commerce platform for managing products, inventory, and orders, exposed via the Shopify Admin API.
Typical use: syncing a product catalog, reading/writing orders, tracking inventory, powering a storefront.
Architectural impact: the application's product/order data may be sourced from or synced with Shopify rather than owned entirely by the app's own database.
Backend/API responsibilities: call the Shopify Admin API server-side using an access token, handle Shopify webhooks (e.g. orders/create, inventory_levels/update), map Shopify resources onto the application's own entities.
Data flow: Backend <-> Shopify Admin API for reads/writes; Shopify webhooks -> backend for near-real-time updates (new orders, inventory changes).
Security: SHOPIFY_ACCESS_TOKEN / SHOPIFY_API_SECRET stay server-side only; verify webhook HMAC signatures; never expose Shopify admin credentials to the frontend.`,
  },

  Gmail: {
    description: `Gmail — transactional email integration
What it is: used here as an email-sending channel (via the Gmail API or SMTP) for transactional and notification emails.
Typical use: account/confirmation emails, password resets, status notifications, periodic digests.
Architectural impact: requires a backend email-sending service layer; emails are dispatched from the server in response to application events, never composed or sent from the client.
Backend/API responsibilities: authenticate via OAuth2 (or SMTP credentials), template and send emails, handle delivery failures/retries, avoid sending on every trivial event.
Data flow: Application event (e.g. new signup, task completed) -> backend -> Gmail API/SMTP -> recipient inbox.
Security: GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN (or SMTP credentials) stay server-side only and are never exposed to the frontend.`,
  },

  Slack: {
    description: `Slack — communication and notification integration
What it is: used as an external channel for pushing notifications about application events into a Slack workspace.
Typical use: notifying a team about new records, status changes, important updates, errors/operational events, or periodic summaries — only for events that are actually worth notifying about.
Architectural impact: the backend needs a notification step triggered by relevant business events; Slack is not queried for application data, only notified.
Backend/API responsibilities: send messages via a Slack Incoming Webhook (or the Slack API where richer interaction is needed), decide which events warrant a notification rather than notifying on every action.
Data flow: User action -> backend -> business logic -> Slack notification (via webhook).
Security: the Slack webhook URL / API token stays server-side only (e.g. SLACK_WEBHOOK_URL) and is never exposed to the frontend.`,
  },

  'Google Sheets': {
    description: `Google Sheets — spreadsheet-based data persistence
What it is: used as a lightweight external data store for applications that don't need a full database.
Typical use: reading application data from a sheet, creating/updating/deleting rows as the application's records change.
Architectural impact: if selected as the project's source of truth, the data flow should be designed around it explicitly rather than treating it as an optional add-on — Google Sheets effectively becomes the persistence layer.
Backend/API responsibilities: all Google Sheets API access happens server-side; map spreadsheet columns to application entities and back; handle API errors and an unavailable/renamed sheet gracefully.
Data flow: Frontend -> Backend API -> Google Sheets API -> Google Sheet (and back, converting rows into structured objects the frontend can use).
Security: service-account credentials (e.g. GOOGLE_SHEETS_CREDENTIALS, GOOGLE_SHEET_ID) stay server-side only and are never exposed to the browser.`,
  },
};
