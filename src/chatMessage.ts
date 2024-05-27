import express, { Request, Response } from "express";
import { prisma } from "./db.ts";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";
import { ReferenceSenderType } from "@prisma/client";

export const chatMessageRouter = express.Router();
chatMessageRouter.use(express.json());

chatMessageRouter.get("/:chatRoomID", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { chatRoomID } = req.params;

    const query = await prisma.chat.findFirst({
        where: {
            chat_id: chatRoomID,
        },
        select: {
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

chatMessageRouter.post("/:chatRoomID", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { chatRoomID } = req.params;
    const { content } = req.body;

    // Check if sender is User or Professional
    const checkQuery = await prisma.user.findUnique({
        where: {
            user_id: user_id,
        },
    });

    let checkProfessionalQuery;

    if (!checkQuery) {
        checkProfessionalQuery = await prisma.professional.findUnique({
            where: {
                professional_id: user_id,
            },
        });
    }

    if (!checkQuery && !checkProfessionalQuery) {
        return res.status(400).json({
            error: "User or Professional not found!",
        });
    }

    // Check if chat room exists
    const checkChatQuery = await prisma.chat.findUnique({
        where: {
            chat_id: chatRoomID,
        },
    });

    if (!checkChatQuery) {
        return res.status(400).json({
            error: "Chat not found!",
        });
    }

    const sender = checkQuery ? "USER" : "PROFESSIONAL";

    const data =
        sender === "USER"
            ? {
                  content: content,
                  user_id: user_id,
                  chat_id: chatRoomID,
                  created_at: new Date(),
                  referenceType: ReferenceSenderType.USER,
              }
            : {
                  content: content,
                  professional_id: user_id,
                  chat_id: chatRoomID,
                  created_at: new Date(),
                  referenceType: ReferenceSenderType.PROFESSIONAL,
              };

    const query = await prisma.chatMessage.create({
        data: data,
    });

    if (!query) {
        return res.status(500).json({
            error: "Something went wrong while creating chat message!",
        });
    }

    return res.status(200).json({ success: true, data: query });
});
