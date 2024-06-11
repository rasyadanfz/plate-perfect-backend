import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { CustomJWTPayload } from "./types/index.js";
dotenv.config();
const access_secret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refresh_secret = process.env.JWT_REFRESH_TOKEN_SECRET;

export function signJWT(payload: CustomJWTPayload) {
    return jsonwebtoken.sign(payload, access_secret!, {
        expiresIn: "3d",
    });
}

export function verifyJWT(token: string) {
    return jsonwebtoken.verify(token, access_secret!);
}

export function signJWTRefreshToken(payload: CustomJWTPayload) {
    return jsonwebtoken.sign(payload, refresh_secret!, {
        expiresIn: "7d",
    });
}

