import express from "express";
import authenticateJWT from "./middleware.ts";
import { authRouter, protectedAuthRouter } from "./auth.ts";
import { profileRouter } from "./profile.ts";
import { bookingRouter } from "./booking.ts";
import { paymentRouter } from "./payment.ts";
import { consultationRouter } from "./consultation.ts";
// Router for unprotected routes
export const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
// Router for protected routes
export const protectedApiRouter = express.Router();
protectedApiRouter.use(authenticateJWT);
protectedApiRouter.use("/auth", protectedAuthRouter);
protectedApiRouter.use("/booking", bookingRouter);
protectedApiRouter.use("/consultation", consultationRouter);
protectedApiRouter.use("/payment", paymentRouter);
protectedApiRouter.use("/profile", profileRouter);
