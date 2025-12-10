const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require("./../models/tourModels");
const Booking = require("./../models/bookingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  
   const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    locale: 'en',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
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
            images: [`/img/tours/${tour.imageCover}`],
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
  if (existing) return res.redirect(req.originalUrl.split('?')[0]);

  await Booking.create({
    tour,
    user,
    price,
    paymentStatus: 'success',
    paymentId: session.payment_intent,
    paid: true,
    txnid: txnId,
  });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking=factory.createOne(Booking);
exports.getBooking=factory.getOne(Booking);
exports.getAllBookings=factory.getAll(Booking);
exports.updateBooking=factory.updateOne(Booking);
exports.deleteBooking=factory.deleteOne(Booking);