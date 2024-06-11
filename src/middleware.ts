import { Response, NextFunction } from "express";
import { verifyJWT } from "./jwt.js";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

/**
 * Middleware for JWT Authentication
 * @param req Request object
 * @param res Response object
 * @param next Function to execute next after this middleware
 * @returns void
 */
const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        console.log("MIDDLEWARE CHECK TOKEN - 1: ", token);
        return res.status(401).json({
            error: "Unauthorized",
        });
    }
    try {
        const verify = verifyJWT(token);
        req.user = verify as CustomJWTPayload;
        next();
    } catch (err) {
        const error = err as Error;
        console.log("MIDDLEWARE CHECK TOKEN - 2: ", error);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Token expired",
            });
        }
        return res.status(401).json({
            error: "Invalid token",

        });
    }
};

export default authenticateJWT;
