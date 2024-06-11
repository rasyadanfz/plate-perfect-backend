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
});

consultationRouter.get(
    "/getConsultationWithConsultationId/:consultation_id",
    async (req:CustomRequest, res:Response)=>{
        const {consultation_id} = req.params;

        const query = await prisma.consultation.findUnique({
            where:{
                consultation_id
            }
        })

        if(!query){
            return res.status(44).json({
                errpr:"Consultation with consultation_id not found"
            })
        }

        res.status(200).json({success:true,data:query});
    }
)

consultationRouter.get(
    "/getConsultationWithBookingId/:booking_id",
    async (req: CustomRequest, res: Response) => {
        const { user_id } = req.user as CustomJWTPayload;
        const { booking_id } = req.params;
        const query = await prisma.consultation.findFirst({
            where: {
                booking_id: booking_id,
            },
        });

        if (!query) {
            return res.status(400).json({
                error: "Consultation with booking ID not found!",
            });
        }
        return res.status(200).json({ success: true, data: query });
    }
);

consultationRouter.get(
    "/getConsultationWithChatId/:chat_id",
    async (req: CustomRequest, res: Response) => {
        const { chat_id } = req.params;
        const query = await prisma.chat.findFirst({
            where: {
                chat_id: chat_id,
            },
        });

        const queryConsultation = await prisma.consultation.findFirst({
            where: {
                consultation_id: query?.consultation_id,
            },
        });

        if (!query || !queryConsultation) {
            return res.status(400).json({
                error: "Consultation with chat ID not found!",
            });
        }

        return res.status(200).json({ success: true, data: queryConsultation });
    }
);

consultationRouter.get("/professionalConsultationList", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;

    const query = await prisma.consultation.findMany({
        where: {
            professional_id: user_id,
        },
        orderBy: {
            date: "desc",
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "No consultation with professional ID found!",
        });
    }
    return res.status(200).json({ success: true, data: query });
});

consultationRouter.get("/professionalNextSchedule", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;

    const query = await prisma.consultation.findMany({
        where: {
            professional_id: user_id,
        },
        orderBy: [
            {
                date: "asc",
            },
            {
                start_time: "asc",
            },
        ],
    });

    if (!query) {
        return res.status(400).json({
            error: "No consultation with professional ID found!",
        });
    }

    const bookingList = await Promise.all(
        query.map((consultation) => {
            return prisma.booking.findUnique({
                where: {
                    booking_id: consultation.booking_id,
                },
            });
        })
    );

    if (!bookingList.length) {
        return res.status(200).json({ success: true, data: [] });
    }
    const paidBookingList = bookingList.filter((booking) => booking!.status === "PAID");
    const set = new Set();

    paidBookingList.forEach((booking) => {
        set.add(booking!.booking_id);
    });

    const filteredQuery = query.filter((consultation) => set.has(consultation.booking_id));

    return res.status(200).json({ success: true, data: filteredQuery });
});

consultationRouter.post("/takeAllConsultation", async (req: CustomRequest, res: Response) => {
    const { professional_id } = req.body;
    const query = await prisma.consultation.findMany({
        where: {
            professional_id: professional_id,
        },
    });

    return res.status(200).json({
        succes: true,
        data: query,
    });
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
