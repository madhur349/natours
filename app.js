const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const cookieParser=require('cookie-parser')
const morgan = require("morgan");
const appError = require("./utils/appError");
const cors = require("cors");
const compression = require("compression");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const globalErrorHandler = require("./controllers/errorController");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const viewRouter = require("./routes/viewRoutes");
const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//1) global middlewares
//Serving static files
app.use(express.static(path.join(__dirname, "public")));

//Set security HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", "ws:", "wss:", "blob:", "data:", "http:", "https:"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://unpkg.com",
        "https://api.maptiler.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://api.maptiler.com",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "blob:",
        "ws:",
        "wss:",
        "https://demotiles.maplibre.org",
        "https://api.maptiler.com",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://js.stripe.com",
        "https://api.stripe.com",
        "https://checkout.stripe.com"
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "blob:", "data:", "https:", "https://checkout.stripe.com"],
      formAction: [
        "'self'", 
        "https://test.payu.in", // Keep generic just in case
        "https://secure.payu.in",
        "https://*.payu.in"
      ],
    },
  })
);




//Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);
app.use(express.urlencoded({extended: true, limit:'10kb'}))
app.use(cookieParser());

//Body parser,reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

app.use(compression());

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
 

  next();
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

//3)Routes


app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/", viewRouter);

// Add root-level login route
app.post('/login', (req, res) => {
  res.redirect('/api/v1/users/login');
});

app.all("*", (req, res, next) => {
  // const err= new Error(`Can't find ${req.originalUrl} on this server!!`);
  // err.status='fail'
  // err.statusCode=404

  next(new appError(`Can't find ${req.originalUrl} on this server!!`, 404));
});

app.use(globalErrorHandler);

//start server
module.exports = app;
