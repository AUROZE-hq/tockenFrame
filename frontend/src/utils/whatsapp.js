import { message } from 'antd';

export const normalizeSriLankanPhone = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove spaces, hyphens, brackets, and plus sign
  let cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '94' + cleaned.substring(1);
  }

  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return '94' + cleaned;
  }

  if (cleaned.length === 11 && cleaned.startsWith('94')) {
    return cleaned;
  }

  return null; // Invalid format
};

export const buildWhatsAppUrl = (phoneNumber, messageText) => {
  const normalizedNumber = normalizeSriLankanPhone(phoneNumber);
  if (!normalizedNumber) {
    return null;
  }
  const encodedMessage = encodeURIComponent(messageText);
  return `https://web.whatsapp.com/send?phone=${normalizedNumber}&text=${encodedMessage}`;
};

export const openWhatsAppChat = (phoneNumber, messageText) => {
  const url = buildWhatsAppUrl(phoneNumber, messageText);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } else {
    message.error('Invalid phone number format.');
    return false;
  }
};
