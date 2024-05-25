import express, { Request, Response } from "express";
import { prisma } from "./db.ts";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

export const consultationRouter = express.Router();
consultationRouter.use(express.json());

consultationRouter.get("/", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const query = await prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            consultations: true,
        },
    });

    let professionalQuery;
    if (!query) {
        professionalQuery = await prisma.professional.findFirst({
            where: {
                professional_id: user_id,
            },
            select: {
                consultations: true,
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
