import axios from 'axios';
import { showAlert } from './alert';

export const stripeSession = async tourId => {
  try {
    const stripe = Stripe(
      'pk_test_51IpuDuSDs8Wx0TszP9BbAikg3s70tHfxG0w6LqsXCJq2rHbBCyc2Y17200Iw3sKriyBlUEUfiqp0aDF9sunWZN8G00Qe1WNgcR'
    );

    const sessionRes = await axios.get(
      `http://127.0.0.1:8050/api/v1/bookings/create-session/${tourId}`
    );

    stripe.redirectToCheckout({ sessionId: sessionRes.data.session.id });
  } catch (err) {
    showAlert('error', 'Error in Processing Payment');
    console.log(err);
  }
};
