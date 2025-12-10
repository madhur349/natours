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
  if (!tour || !user || !price || !sessionId) return next();

  // Verify session with Stripe and ensure payment is completed
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session || session.payment_status !== 'paid') return next();

  const txnId = session.id || session.payment_intent;

  // Avoid duplicate bookings for same transaction
  const existing = await Booking.findOne({ txnid: txnId });
  if (existing) {
    // Use absolute URL for redirect in serverless environments
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || process.env.HOST || 'localhost:3000';
    return res.redirect(`${protocol}://${host}/`);
  }

  await Booking.create({
    tour,
    user,
    price,
    paymentStatus: 'success',
    paymentId: session.payment_intent,
    paid: true,
    txnid: txnId,
  });

  // Use absolute URL for redirect in serverless environments (Netlify, Vercel, etc.)
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || process.env.HOST || 'localhost:3000';
  res.redirect(`${protocol}://${host}/`);
});

exports.createBooking=factory.createOne(Booking);
exports.getBooking=factory.getOne(Booking);
exports.getAllBookings=factory.getAll(Booking);
exports.updateBooking=factory.updateOne(Booking);
exports.deleteBooking=factory.deleteOne(Booking);