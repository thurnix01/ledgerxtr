export type ContactFormPayload = {
  full_name: string
  email: string
  organization_type: string
  services_needed: string[]
  services_needed_text: string
  business_name: string | null
  industry: string | null
  years_in_business: string | null
  accounting_software: string
  books_status: string
  start_timeline: string
  transaction_volume: string | null
  additional_notes: string | null
  preferred_next_step: string | null
  preferred_timeframe: string
  message: string
  phone: string | null
  source: string
  status: string
  submitted_at: string
}

export type ContactFormInput = {
  fullName: string
  email: string
  businessName: string
  orgType: string
  industry: string
  yearsInBusiness: string
  servicesNeeded: string[]
  accountingSoftware: string
  booksStatus: string
  startTimeline: string
  transactionVolume: string
  additionalNotes: string
  preferredNextStep: string
}

export function buildContactFormPayload(input: ContactFormInput): ContactFormPayload {
  const servicesNeeded = input.servicesNeeded
  const notes = input.additionalNotes.trim()
  const servicesBlock =
    servicesNeeded.length > 0
      ? `Service needs:\n${servicesNeeded.map((s) => `• ${s}`).join('\n')}`
      : ''
  const combinedMessage = [notes, servicesBlock].filter(Boolean).join('\n\n')

  return {
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    organization_type: input.orgType,
    services_needed: servicesNeeded,
    services_needed_text: servicesNeeded.join(', '),
    business_name: input.businessName.trim() || null,
    industry: input.industry.trim() || null,
    years_in_business: input.yearsInBusiness || null,
    accounting_software: input.accountingSoftware,
    books_status: input.booksStatus,
    start_timeline: input.startTimeline,
    transaction_volume: input.transactionVolume || null,
    additional_notes: input.additionalNotes.trim() || null,
    preferred_next_step: input.preferredNextStep || null,
    preferred_timeframe: input.startTimeline,
    message: combinedMessage || '',
    phone: null,
    source: 'ledgerxtr.com',
    status: 'new',
    submitted_at: new Date().toISOString(),
  }
}

/**
 * Posts to an n8n webhook.
 * Uses text/plain so browsers treat it as a "simple request" (no CORS preflight).
 * Self-hosted n8n should still set Allowed Origins to https://ledgerxtr.com (and localhost for testing).
 */
export async function submitContactForm(
  webhookUrl: string,
  payload: ContactFormPayload,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      detail
        ? `Webhook failed (${response.status}): ${detail}`
        : `Webhook failed with status ${response.status}`,
    )
  }
}
