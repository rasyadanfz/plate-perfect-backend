import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { CustomJWTPayload } from "./types/index.js";
dotenv.config();

export function signJWT(payload: CustomJWTPayload) {
    return jsonwebtoken.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "1h",
    });
}

export function verifyJWT(token: string) {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET!);
}
