import express, { Request, Response } from "express";
import { prisma } from "./db.ts";
import bcrypt from "bcrypt";
import { signJWT } from "./jwt.ts";

// Auth Router
export const authRouter = express.Router();
authRouter.use(express.json());

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

    return res.status(200).json({ success: true, token: token });
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
