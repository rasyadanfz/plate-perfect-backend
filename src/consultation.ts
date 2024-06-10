import express, { Response } from "express";
import { prisma } from "./db.js";
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
})

consultationRouter.post("/takeAllConsultation", async  (req: CustomRequest, res: Response) => {


    const {professional_id} = req.body;
    const query = await prisma.consultation.findMany({
        where: {
            professional_id: professional_id,
        },
    });


    return res.status(200).json({
        succes:true,
        data: query
    })




});

consultationRouter.delete("/deleteConsultation", async (req: CustomRequest, res: Response) => {
    const { consultation_id } = req.body;

    const query = await prisma.consultation.delete({
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
    const deleteChatRoom = await prisma.chat.delete({
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
    const deleteChatMessages = await prisma.chatMessage.deleteMany({
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
});
