/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Validates if an email is a valid MFU student email.
 */
export const isValidMfuEmail = (email: string): boolean => {
  const mfuRegex = /^[a-zA-Z0-9._%+-]+@lamduan\.mfu\.ac\.th$/;
  const adminRegex = /^admin@mfu\.ac\.th$/; // For prototype admin
  return mfuRegex.test(email) || adminRegex.test(email);
};

/**
 * Sanitizes input to prevent basic XSS.
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Simulates AI moderation for item listings.
 * Checks for prohibited keywords.
 */
export const simulateAiModeration = (title: string, description: string): { isFlagged: boolean; reason?: string } => {
  const prohibitedKeywords = ['weapon', 'drug', 'alcohol', 'exam', 'cheat'];
  const content = (title + ' ' + description).toLowerCase();
  
  for (const keyword of prohibitedKeywords) {
    if (content.includes(keyword)) {
      return { isFlagged: true, reason: `Contains prohibited keyword: ${keyword}` };
    }
  }
  
  return { isFlagged: false };
};

/**
 * Formats currency in THB.
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(price);
};
