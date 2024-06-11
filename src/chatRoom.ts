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

chatRoomRouter.get(
    "/getRoomWithConsultationId/:consultation_id",
    async (req: CustomRequest, res: Response) => {
        const { user_id } = req.user as CustomJWTPayload;
        const { consultation_id } = req.params;

        const query = await prisma.chat.findFirst({
            where: {
                consultation_id: consultation_id,
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
    }
);

chatRoomRouter.get("/room/:roomId", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { roomId } = req.params;

    const query = await prisma.chat.findFirst({
        where: {
            chat_id: roomId,
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

export async function getUsersInRoom(chatRoomID: string) {
    const users = await prisma.user.findFirst({
        where: {
            currentChatRoom: {
                not: null,
                equals: chatRoomID,
            },
        },
    });

    const professional = await prisma.user.findFirst({
        where: {
            currentChatRoom: {
                not: null,
                equals: chatRoomID,
            },
        },
    });

    const userInRoom = [users, professional];

    return userInRoom;
}

export async function getUserActiveRoom(userId: string, role: string) {
    if (role === "USER") {
        const user = await prisma.user.findFirst({
            where: {
                user_id: userId,
            },
        });
        if (!user) return null;

        return user.currentChatRoom;
    } else if (role === "PROFESSIONAL") {
        const professional = await prisma.professional.findFirst({
            where: {
                professional_id: userId,
            },
        });
        if (!professional) return null;

        return professional.currentChatRoom;
    }

    return null;
}

export async function getAllActiveRooms() {
    const userRooms = await prisma.user.findMany({
        where: {
            currentChatRoom: {
                not: null,
            },
        },
        select: {
            currentChatRoom: true,
        },
    });

    const professionalRooms = await prisma.professional.findMany({
        where: {
            currentChatRoom: {
                not: null,
            },
        },
        select: {
            currentChatRoom: true,
        },
    });
    const rooms = userRooms.concat(professionalRooms);

    return Array.from(new Set(rooms));
}

export async function activateUser(id: string, name: string, room: string) {
    const user = await prisma.user.findFirst({
        where: {
            user_id: id,
        },
    });

    const professional = await prisma.professional.findFirst({
        where: {
            professional_id: id,
        },
    });

    if (user) {
        const userUpdate = await prisma.user.update({
            where: {
                user_id: id,
            },
            data: {
                currentChatRoom: room,
            },
        });
        return userUpdate;
    } else if (professional) {
        const professionalUpdate = await prisma.professional.update({
            where: {
                professional_id: id,
            },
            data: {
                currentChatRoom: room,
            },
        });
        return professionalUpdate;
    } else {
        return null;
    }
}

export async function userLeavesApp(id: string) {
    const user = await prisma.user.findFirst({
        where: {
            user_id: id,
        },
    });

    const professional = await prisma.professional.findFirst({
        where: {
            professional_id: id,
        },
    });

    if (user) {
        const userUpdate = await prisma.user.update({
            where: {
                user_id: id,
            },
            data: {
                currentChatRoom: null,
            },
        });
        return [userUpdate, user.currentChatRoom];
    } else if (professional) {
        const professionalUpdate = await prisma.professional.update({
            where: {
                professional_id: id,
            },
            data: {
                currentChatRoom: null,
            },
        });
        return [professionalUpdate, professional.currentChatRoom];
    } else {
        return null;
    }
}
