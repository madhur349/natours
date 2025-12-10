const axios = window.axios;
import { showAlert } from './alerts.js';
const stripe = Stripe('pk_test_51ScMSvEXI2LWzIwahY0cL6I9cAvlVn2CuE6GdUhBWw5X3O7Whhaz73SYtu3bT8d68HS9NVRZt5QzUhrNixSgOrX300EyazkEQm');

export const bookTour = async (tourId) => {
  try{
    const { data } = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
      withCredentials: true,
    });
    if (data.status === 'success') {
      await stripe.redirectToCheckout({ sessionId: data.session.id });
    } else {
      console.error(data.message);
    }
  } catch (error) {
    console.error(error);
    showAlert('error', error.response?.data?.message || 'Something went wrong!');
  }
} 