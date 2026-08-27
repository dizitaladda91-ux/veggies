import api from './api';

export const createPaymentOrder = async (payload) => (await api.post('/payments/create-order', payload)).data.data;
export const verifyPayment = async (payload) => (await api.post('/payments/verify', payload)).data.data;

export const openRazorpayCheckout = async ({ order, customer, onSuccess, onFailure }) => {
  if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable. Load https://checkout.razorpay.com/v1/checkout.js first.');
  const checkout = new window.Razorpay({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: 'Veggie Affiliate', prefill: customer, handler: onSuccess, modal: { ondismiss: onFailure } });
  checkout.open();
};
