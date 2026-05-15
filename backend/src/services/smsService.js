const axios = require('axios');

const normalizeSriLankanPhone = (phoneNumber) => {
  if (!phoneNumber) throw new Error('Invalid Sri Lankan phone number format.');
  
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

  throw new Error('Invalid Sri Lankan phone number format.');
};

const sendSMS = async ({ to, message }) => {
  try {
    const normalizedTo = normalizeSriLankanPhone(to);

    const payload = {
      user_id: process.env.NOTIFY_LK_USER_ID,
      api_key: process.env.NOTIFY_LK_API_KEY,
      sender_id: process.env.NOTIFY_LK_SENDER_ID,
      to: normalizedTo,
      message: message
    };

    const response = await axios.post('https://app.notify.lk/api/v1/send', payload);

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        status: 'sent',
        normalizedPhoneNumber: normalizedTo,
        providerResponse: response.data
      };
    } else {
      return {
        success: false,
        status: 'failed',
        normalizedPhoneNumber: normalizedTo,
        errorMessage: response.data?.errors || 'API returned failure status',
        providerResponse: response.data
      };
    }
  } catch (error) {
    let normalizedFallback = '';
    try {
      normalizedFallback = normalizeSriLankanPhone(to);
    } catch (e) {
      // Ignore
    }

    return {
      success: false,
      status: 'failed',
      normalizedPhoneNumber: normalizedFallback,
      errorMessage: error.message || 'Network or internal error',
      providerResponse: error.response?.data || null
    };
  }
};

const sendOrderPlacedSMS = async (order) => {
  let serviceDisplay = "Photo Print / Frame";
  if (order.serviceType === "frame") serviceDisplay = "Frame";
  else if (order.serviceType === "print") serviceDisplay = "Print";
  else if (order.serviceType === "both") serviceDisplay = "Frame & Print";

  const message = `Coastal Creatives Production

Dear Sir/Madam,

Your order has been successfully received.
Photo No: ${order.photoNumber}
Name: ${order.customerName}
Service: ${serviceDisplay}

We will notify you once your order is ready for collection.
For assistance, please contact us.

Regards,
Coastal Creatives Production
+94 76 800 9593
coastalcreatives.info@gmail.com`;

  return await sendSMS({ to: order.phoneNumber, message });
};

const sendWorkCompletedSMS = async (order) => {
  const message = `Coastal Creatives Production

Dear Sir/Madam,

Your order has been completed successfully.

Kindly visit the collection point and collect your order.

Regards,
Coastal Creatives Production
+94 76 800 9593
coastalcreatives.info@gmail.com`;

  return await sendSMS({ to: order.phoneNumber, message });
};

module.exports = {
  normalizeSriLankanPhone,
  sendSMS,
  sendOrderPlacedSMS,
  sendWorkCompletedSMS
};
