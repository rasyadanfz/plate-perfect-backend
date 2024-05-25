import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "./jwt.ts";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

/**
 * Middleware for JWT Authentication
 * @param req Request object
 * @param res Response object
 * @param next Function to execute next after this middleware
 * @returns void
 */
const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    try {
        const verify = verifyJWT(token);
        req.user = verify as CustomJWTPayload;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid token",
        });
    }
};

export default authenticateJWT;
