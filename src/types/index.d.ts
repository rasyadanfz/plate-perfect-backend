import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { JWTPayload } from "../jwt.ts";

export interface CustomJWTPayload extends JWTPayload {
    user_id: string;
    email: string;
    role: string;
}

export interface CustomRequest extends Request {
    user?: CustomJWTPayload;
}
