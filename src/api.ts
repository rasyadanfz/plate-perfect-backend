import express, { Request, Response } from "express";
import authenticateJWT from "./middleware.ts";
import { authRouter } from "./auth.ts";
import { profileRouter } from "./profile.ts";

// Router for unprotected routes
export const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);

// Router for protected routes
export const protectedApiRouter = express.Router();
protectedApiRouter.use(authenticateJWT);
protectedApiRouter.use("/profile", profileRouter);
