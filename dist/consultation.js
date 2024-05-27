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
export const consultationRouter = express.Router();
consultationRouter.use(express.json());
consultationRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const query = yield prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            consultations: true,
        },
    });
    let professionalQuery;
    if (!query) {
        professionalQuery = yield prisma.professional.findFirst({
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
}));
consultationRouter.delete("/deleteConsultation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { consultation_id } = req.body;
    const query = yield prisma.consultation.delete({
        where: {
            consultation_id: consultation_id,
        },
    });
    if (!query) {
        return res.status(500).json({
            error: "Something went wrong while deleting consultation!",
        });
    }
    // Delete chat room
    const deleteChatRoom = yield prisma.chat.delete({
        where: {
            consultation_id: consultation_id,
        },
    });
    if (!deleteChatRoom) {
        return res.status(500).json({
            error: "Something went wrong while deleting chat room!",
        });
    }
    // Delete chat messages
    const deleteChatMessages = yield prisma.chatMessage.deleteMany({
        where: {
            chat_id: deleteChatRoom.chat_id,
        },
    });
    if (!deleteChatMessages) {
        return res.status(500).json({
            error: "Something went wrong while deleting chat messages!",
        });
    }
    return res.status(200).json({ success: true, data: query });
}));
