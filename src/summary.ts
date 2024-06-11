import express from "express";
import { CustomRequest } from "./types";
import { Response } from "express";
import { prisma } from "./db.js";

export const summaryRouter = express.Router();
summaryRouter.use(express.json());

summaryRouter.get("/:consultation_id", async (req: CustomRequest, res: Response) => {
    const { consultation_id } = req.params;

    const query = await prisma.summary.findUnique({
        where: {
            consultation_id: consultation_id,
        },
    });

    if (!query) {
        return res.status(404).json({
            error: "Summary not found",
        });
    }

    return res.status(200).json({
        message: "succes",
        data: query,
    });
});

summaryRouter.post("/:consultation_id", async (req: CustomRequest, res: Response) => {
    const { consultation_id } = req.params;
    const { content } = req.body;

    const consultationData = await prisma.consultation.findFirst({
        where: {
            consultation_id: consultation_id,
        },
    });

    if (!consultationData) {
        return res.status(500).json({ error: "Consultation not found" });
    }

    const query = await prisma.summary.create({
        data: {
            consultation_id: consultation_id,
            professional_id: consultationData!.professional_id,
            content: content,
        },
    });

    if (!query) {
        return res.status(500).json({
            error: "Failed to create summary",
        });
    }

    return res.status(200).json({
        message: "succes",
        data: query,
    });
});
