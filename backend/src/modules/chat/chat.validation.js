const SUPPORTED_INTEGRATIONS = ['Stripe', 'Shopify', 'Gmail', 'Slack', 'Google Sheets'];

const validatePrompt = (prompt, errors) => {
  if (prompt === undefined || prompt === null) {
    errors.push('prompt is required');
  } else if (typeof prompt !== 'string') {
    errors.push('prompt must be a string');
  } else if (prompt.trim().length === 0) {
    errors.push('prompt must not be empty');
  } else if (prompt.length > 2000) {
    errors.push('prompt must not exceed 2000 characters');
  }
};

export const validateChatInput = (body) => {
  const errors = [];
  const { prompt, integrations } = body;

  validatePrompt(prompt, errors);

  // Validate integrations
  if (!Array.isArray(integrations)) {
    errors.push('integrations must be an array');
  } else if (integrations.length > 5) {
    errors.push('integrations must not exceed 5 items');
  } else {
    for (const item of integrations) {
      if (!SUPPORTED_INTEGRATIONS.includes(item)) {
        errors.push(
          `"${item}" is not a supported integration. Supported: ${SUPPORTED_INTEGRATIONS.join(', ')}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateFollowUpInput = (body) => {
  const errors = [];
  const { prompt } = body;

  validatePrompt(prompt, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
};
