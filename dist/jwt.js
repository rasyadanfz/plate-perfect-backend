import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const access_secret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refresh_secret = process.env.JWT_REFRESH_TOKEN_SECRET;
export function signJWT(payload) {
    return jsonwebtoken.sign(payload, access_secret, {
        expiresIn: "1d",
    });
}
export function verifyJWT(token) {
    return jsonwebtoken.verify(token, access_secret);
}
export function signJWTRefreshToken(payload) {
    return jsonwebtoken.sign(payload, refresh_secret, {
        expiresIn: "7d",
    });
}
