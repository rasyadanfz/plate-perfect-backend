var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { prisma } from "./db.ts";
import { ReferenceSenderType } from "@prisma/client";
export const chatMessageRouter = express.Router();
chatMessageRouter.use(express.json());
chatMessageRouter.get("/:chatRoomID", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const { chatRoomID } = req.params;
    const query = yield prisma.chat.findFirst({
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
}));
chatMessageRouter.post("/:chatRoomID", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const { chatRoomID } = req.params;
    const { content } = req.body;
    // Check if sender is User or Professional
    const checkQuery = yield prisma.user.findUnique({
        where: {
            user_id: user_id,
        },
    });
    let checkProfessionalQuery;
    if (!checkQuery) {
        checkProfessionalQuery = yield prisma.professional.findUnique({
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
    const checkChatQuery = yield prisma.chat.findUnique({
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
    const data = sender === "USER"
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
    const query = yield prisma.chatMessage.create({
        data: data,
    });
    if (!query) {
        return res.status(500).json({
            error: "Something went wrong while creating chat message!",
        });
    }
    return res.status(200).json({ success: true, data: query });
}));
