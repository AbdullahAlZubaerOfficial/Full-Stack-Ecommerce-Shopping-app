import express from "express";
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import cors from "cors";

import { functions, inngest } from "./config/inngest.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import paymentRoutes from "./routes/payment.route.js";

const app = express();

// Connect to MongoDB once
await connectDB();

// Middleware
app.use(
  "/api/payment",
  (req, res, next) => {
    if (req.originalUrl === "/api/payment/webhook") {
      express.raw({ type: "application/json" })(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  },
  paymentRoutes
);

app.use(express.json());
app.use(clerkMiddleware());

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      ENV.CLIENT_URL,
      "https://expo-ecommerce-three.vercel.app",
      "http://localhost:5174",
    ];

    if (allowedOrigins.includes(origin) || ENV.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Request logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Success" });
});

// Serve admin frontend in production
if (ENV.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "../admin/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin", "dist", "index.html"));
  });
}

// Export the app for Vercel
export default app;
