const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require("./../models/tourModels");
const Booking = require("./../models/bookingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  
  // Get the correct protocol and host for serverless environments (Netlify, Vercel, etc.)
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || process.env.HOST || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  
  // Construct absolute image URL
  const imageUrl = tour.imageCover.startsWith('http') 
    ? tour.imageCover 
    : `${baseUrl}/img/tours/${tour.imageCover}`;
  
   const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    locale: 'en',
    success_url: `${baseUrl}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [imageUrl],
          },
        },
      },
    ],
  });
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price, session_id: sessionId } = req.query;
  
  // If no payment query params, continue to next middleware
  if (!tour || !user || !price || !sessionId) return next();

  try {
    // Verify session with Stripe and ensure payment is completed
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      console.log('Stripe session not found:', sessionId);
      return next();
    }
    
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed. Status:', session.payment_status);
      return next();
    }

    const txnId = session.id || session.payment_intent;

    // Avoid duplicate bookings for same transaction
    const existing = await Booking.findOne({ txnid: txnId });
    if (existing) {
      console.log('Booking already exists for transaction:', txnId);
      // Use absolute URL for redirect in serverless environments
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host') || process.env.HOST || 'localhost:3000';
      return res.redirect(`${protocol}://${host}/`);
    }

    // Create the booking
    await Booking.create({
      tour,
      user,
      price,
      paymentStatus: 'success',
      paymentId: session.payment_intent,
      paid: true,
      txnid: txnId,
    });

    console.log('Booking created successfully for tour:', tour);

    // Use absolute URL for redirect in serverless environments (Netlify, Vercel, etc.)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || process.env.HOST || 'localhost:3000';
    const redirectUrl = `${protocol}://${host}/`;
    
    console.log('Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in createBookingCheckout:', error);
    // Even on error, redirect to clean URL to avoid showing error in URL
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || process.env.HOST || 'localhost:3000';
    return res.redirect(`${protocol}://${host}/`);
  }
});

exports.createBooking=factory.createOne(Booking);
exports.getBooking=factory.getOne(Booking);
exports.getAllBookings=factory.getAll(Booking);
exports.updateBooking=factory.updateOne(Booking);
exports.deleteBooking=factory.deleteOne(Booking);