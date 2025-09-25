import createError from "http-errors";
import express from "express";
import path, { dirname } from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import logger from "./utilities/logger.js";
import routes from "./routes/index.js";
import rateLimiter from "./middleware/rateLimiter.js";

import "./database/index.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(rateLimiter);
app.use(compression());
app.use(cookieParser());
// Configure CORS properly for cross-origin requests with credentials
const allowedOrigins = ["http://localhost:4200"]; // Frontend dev server

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed from this origin"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);
// Explicitly handle preflight requests
app.options("*", cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", routes);

app.use(
  morgan("combined", {
    stream: logger.stream,
    skip: (req, res) => {
      // Skip to log health endpoint
      return req.url === "/health";
    },
  })
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

export default app;
