import express, { Request, Response } from "express";
import { prisma } from "./db.ts";
import bcrypt from "bcrypt";
import { signJWT, signJWTRefreshToken } from "./jwt.ts";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

// Auth Router
export const authRouter = express.Router();
export const protectedAuthRouter = express.Router();
authRouter.use(express.json());
protectedAuthRouter.use(express.json());

authRouter.post("/login", async (req: Request, res: Response) => {
    const { email, password }: { email: string; password: string } = req.body;
    const userQuery = await prisma.user.findFirst({
        where: {
            email: email,
        },
    });

    let professionalQuery;
    if (!userQuery) {
        professionalQuery = await prisma.professional.findFirst({
            where: {
                email: email,
            },
        });

        if (!professionalQuery) {
            return res.status(400).json({
                error: "User not found",
            });
        }
    }

    const hashedPassword = userQuery ? userQuery.hashedPassword : professionalQuery!.hashedPassword;

    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
        return res.status(400).json({
            error: "Wrong password",
        });
    }

    const userId = userQuery ? userQuery.user_id : professionalQuery!.professional_id;
    const acc_email = userQuery ? userQuery.email : professionalQuery!.email;
    const role = userQuery ? "user" : "professional";
    const token = signJWT({ user_id: userId, email: acc_email, role: role });
    const refreshToken = signJWTRefreshToken({ user_id: userId, email: acc_email, role: role });

    // Insert refresh token to DB
    const insertRefreshToken = await prisma.refreshToken.upsert({
        create: {
            user_id: userId,
            token: refreshToken,
        },
        update: {
            token: refreshToken,
        },
        where: {
            user_id: userId,
        },
    });

    if (!insertRefreshToken) {
        return res.status(500).json({
            error: "Something went wrong!",
        });
    }

    return res.status(200).json({ success: true, token: token, refreshToken: refreshToken });
});

authRouter.post("/register", async (req: Request, res: Response) => {
    const {
        email,
        password,
        isProfessional,
    }: { email: string; password: string; isProfessional: boolean } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let createQuery;
    if (!isProfessional) {
        createQuery = await prisma.user.create({
            data: {
                email: email,
                hashedPassword: hashedPassword,
            },
        });
    } else {
        createQuery = await prisma.professional.create({
            data: {
                email: email,
                hashedPassword: hashedPassword,
                description: "",
            },
        });
    }

    if (!createQuery) {
        return res.status(500).json({
            error: "Something went wrong!",
        });
    }

    return res.status(200).json({ success: true });
});

authRouter.post("/token", async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const refreshToken = await prisma.refreshToken.findFirst({
        where: {
            token: token,
        },
    });

    if (!refreshToken) return res.status(403).json({ error: "Invalid token" });

    const user = await prisma.user.findFirst({
        where: {
            user_id: refreshToken.user_id,
        },
    });

    let professional;
    if (!user) {
        professional = await prisma.professional.findFirst({
            where: {
                professional_id: refreshToken.user_id,
            },
        });

        if (!professional) return res.status(403).json({ error: "Invalid token" });
    }

    const data = user
        ? { user_id: user.user_id, email: user.email, role: "user" }
        : { user_id: professional!.professional_id, email: professional!.email, role: "professional" };
    const accessToken = signJWT(data);

    return res.status(200).json({ success: true, token: accessToken });
});

authRouter.post("/logout", async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
        const fetchRefreshToken = await prisma.refreshToken.findFirst({
            where: {
                token: token,
            },
        });

        if (!fetchRefreshToken) return res.status(403).json({ error: "Invalid token" });

        const deleteRefreshToken = await prisma.refreshToken.delete({
            where: {
                user_id: fetchRefreshToken.user_id,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: "Something went wrong!" });
    }

    return res.status(204).json({ success: true });
});

protectedAuthRouter.get("/me", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;

    const userQuery = await prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
    });

    let profQuery;
    if (!userQuery) {
        profQuery = await prisma.professional.findFirst({
            where: {
                professional_id: user_id,
            },
        });
        if (!profQuery) {
            return res.status(400).json({
                error: "User not found!",
            });
        }
    }

    const data = userQuery ? userQuery : profQuery;
    const role = userQuery ? "USER" : "PROFESSIONAL";
    return res.status(200).json({ success: true, data: data, role: role });
});
