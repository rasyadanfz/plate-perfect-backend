import express, { Response } from "express";
import { prisma } from "./db.js";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";
import { ProfessionalRole } from "@prisma/client";

export const profileRouter = express.Router();
profileRouter.use(express.json());

profileRouter.get("/", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const query = await prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            email: true,
            name: true,
            country: true,
            age: true,
            gender: true,
            allergies: true,
            medicalRecords: true,
            date_of_birth: true,
            phone_num: true,
            hashedPassword: false,
            user_id: true,
        },
    });

    let professionalQuery;
    if (!query) {
        professionalQuery = await prisma.professional.findFirst({
            where: {
                professional_id: user_id,
            },
            select: {
                professional_id: true,
                role: true,
                email: true,
                hashedPassword: false,
                name: true,
                phone_num: true,
                balance: true,
                experience: true,
            },
        });
        if (!professionalQuery) {
            return res.status(400).json({
                error: "User not found!",
            });
        }
    }

    const data = query ? query : professionalQuery;
    return res.status(200).json({ success: true, data: data });
});

profileRouter.put("/user", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    console.log(user_id);
    const {
        email,
        name,
        country,
        age,
        gender,
        allergies,
        medicalRecords,
        DoB,
        phoneNum,
        firstCompleted,
    }: {
        email: string;
        name: string;
        country: string;
        age: number;
        gender: string;
        allergies: string[];
        medicalRecords: string[];
        DoB: Date;
        phoneNum: string;
        firstCompleted?: boolean;
    } = req.body;

    const query = await prisma.user.update({
        where: {
            user_id: user_id,
        },
        data: {
            name: name,
            country: country,
            age: age,
            gender: gender,
            allergies: allergies,
            medicalRecords: medicalRecords,
            date_of_birth: DoB,
            phone_num: phoneNum,
            hasCompletedData: firstCompleted ? firstCompleted : true,
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "User not found!",
        });
    }

    return res.status(200).json({ success: true });
});

profileRouter.put("/professional", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const {
        name,
        role,
        phone_num,
        experience,
        description,
        firstCompleted,
    }: {
        name: string;
        role: ProfessionalRole;
        phone_num: string;
        experience: number;
        description: string;
        firstCompleted?: boolean;
    } = req.body;

    const query = await prisma.professional.update({
        where: {
            professional_id: user_id,
        },
        data: {
            name: name,
            role: role,
            phone_num: phone_num,
            experience: experience,
            description: description,
            hasCompletedData: firstCompleted ? firstCompleted : true,
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "User not found!",
        });
    }

    return res.status(200).json({ success: true });
});

profileRouter.put("/professional/balance", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { balance }: { balance: number } = req.body;

    const currBalance = await prisma.professional.findFirst({
        where: {
            professional_id: user_id,
        },
        select: {
            balance: true,
        },
    });

    const query = await prisma.professional.update({
        where: {
            professional_id: user_id,
        },
        data: {
            balance: currBalance!.balance - balance,
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "User not found!",
        });
    }

    return res.status(200).json({ success: true });
});
