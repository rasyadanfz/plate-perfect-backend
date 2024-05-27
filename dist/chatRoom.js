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
export const chatRoomRouter = express.Router();
chatRoomRouter.use(express.json());
chatRoomRouter.get("/:consultationId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const { consultationId } = req.params;
    const query = yield prisma.chat.findFirst({
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
}));
chatRoomRouter.post("/:consultationId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const { consultationId } = req.params;
    const query = yield prisma.chat.findFirst({
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
    const newChat = yield prisma.chat.create({
        data: {
            consultation_id: consultationId,
        },
    });
    return res.status(200).json({ success: true, data: newChat });
}));
