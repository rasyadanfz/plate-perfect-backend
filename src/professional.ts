import express, { Response } from "express";
import { prisma } from "./db.js";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

export const professionalRouter = express.Router();
professionalRouter.use(express.json());

professionalRouter.get("/getAllProfessional", async (req: CustomRequest, res: Response) => {
    // get All Professional
    const professionalQuery = await prisma.professional.findMany();

    if (!professionalQuery) {
        return res.status(404).json({
            error: "Data not Found",
        });
    }

    return res.status(200).json({ success: true, data: professionalQuery });
});

professionalRouter.get("/getProfId/:professional_id", async (req: CustomRequest, res: Response) => {
    const { professional_id } = req.params;
    const professionalQuery = await prisma.professional.findFirst({
        where: {
            professional_id: professional_id,
        },
    });

    if (!professionalQuery) {
        return res.status(400).json({
            message: "Data not Found",
        });
    }

    return res.status(200).json({ success: true, data: professionalQuery });
});

professionalRouter.get("/getOneProfessional", async (req: CustomRequest, res: Response) => {
    // get All Professional
    const professionalQuery = await prisma.professional.findMany();

    if (!professionalQuery) {
        return res.status(404).json({
            error: "Data not Found",
        });
    }

    return res.status(200).json({ success: true, data: professionalQuery[0] });
});
