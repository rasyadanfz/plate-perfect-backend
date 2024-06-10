import express from "express";
import authenticateJWT from "./middleware.js";
import { authRouter, protectedAuthRouter } from "./auth.js";
import { profileRouter } from "./profile.js";
import { bookingRouter } from "./booking.js";
import { paymentRouter } from "./payment.js";
import { consultationRouter } from "./consultation.js";
import { chatMessageRouter } from "./chatMessage.js";
import { chatRoomRouter } from "./chatRoom.js";

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
protectedApiRouter.use("/chatMsg", chatMessageRouter);
protectedApiRouter.use("/chatRoom", chatRoomRouter);
