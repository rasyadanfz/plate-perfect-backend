import express, { Response } from "express";
import { prisma } from "./db.js";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

export const chatRoomRouter = express.Router();
chatRoomRouter.use(express.json());

chatRoomRouter.get("/:consultationId", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { consultationId } = req.params;

    const query = await prisma.chat.findFirst({
        where: {
            consultation_id: consultationId,
        },
        select: {
            chat_id: true,
            messages: true,
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "Chat not found!",
        });
    }

    return res.status(200).json({ success: true, data: query });
});

chatRoomRouter.post("/:consultationId", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { consultationId } = req.params;

    const query = await prisma.chat.findFirst({
        where: {
            consultation_id: consultationId,
        },
        select: {
            chat_id: true,
            messages: true,
        },
    });

    if (query) {
        return res.status(400).json({
            error: "Chat Room for that consultation ID already exists!",
        });
    }

    const newChat = await prisma.chat.create({
        data: {
            consultation_id: consultationId,
        },
    });
    return res.status(200).json({ success: true, data: newChat });
});
