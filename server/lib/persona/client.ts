/**
 * Persona API Client
 * Handles identity verification via Persona
 */

import crypto from 'node:crypto';

const PERSONA_API_KEY = process.env.PERSONA_API_KEY;
const PERSONA_ENV = process.env.PERSONA_ENV || 'sandbox';
const PERSONA_BASE_URL = PERSONA_ENV === 'production' 
  ? 'https://withpersona.com/api/v1'
  : 'https://sandbox.withpersona.com/api/v1';

interface PersonaInquiry {
  data: {
    id: string;
    type: 'inquiry';
    attributes: {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      redirect_url: string;
      reference_id: string;
      created_at: string;
    };
  };
}

interface CreateInquiryParams {
  templateId: string;
  referenceId: string;
  fields?: {
    name_first?: string;
    name_last?: string;
    email_address?: string;
  };
}

/**
 * Create a Persona verification inquiry
 */
export async function createPersonaInquiry(params: CreateInquiryParams): Promise<PersonaInquiry> {
  if (!PERSONA_API_KEY) {
    throw new Error('PERSONA_API_KEY not configured');
  }

  const response = await fetch(`${PERSONA_BASE_URL}/inquiries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERSONA_API_KEY}`,
      'Content-Type': 'application/json',
      'Persona-Version': '2024-11-20',
    },
    body: JSON.stringify({
      data: {
        type: 'inquiry',
        attributes: {
          template_id: params.templateId,
          reference_id: params.referenceId,
          fields: params.fields || {},
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Persona API error: ${error.errors?.[0]?.detail || error.error || response.statusText}`);
  }

  return await response.json();
}

/**
 * Get inquiry status
 */
export async function getPersonaInquiry(inquiryId: string): Promise<PersonaInquiry> {
  if (!PERSONA_API_KEY) {
    throw new Error('PERSONA_API_KEY not configured');
  }

  const response = await fetch(`${PERSONA_BASE_URL}/inquiries/${inquiryId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PERSONA_API_KEY}`,
      'Persona-Version': '2024-11-20',
    },
  });

  if (!response.ok) {
    throw new Error(`Persona API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Verify webhook signature
 */
export function verifyPersonaWebhook(
  signature: string,
  body: string,
  secret: string
): boolean {
  // Persona uses HMAC SHA256 for webhook signatures
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Persona] Webhook verification error:', error);
    return false;
  }
}

