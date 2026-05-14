// Stub for WhatsApp Service

const sendOrderPlacedMessage = async (order) => {
  console.log(`[WhatsApp Stub] Sending order placed message to ${order.phoneNumber}`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    status: "simulated",
    simulated: true
  };
};

const sendWorkCompletedMessage = async (order) => {
  console.log(`[WhatsApp Stub] Sending work completed message to ${order.phoneNumber}`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    status: "simulated",
    simulated: true
  };
};

module.exports = {
  sendOrderPlacedMessage,
  sendWorkCompletedMessage
};
