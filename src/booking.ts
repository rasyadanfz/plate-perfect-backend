import express, { Request, Response } from "express";
import { prisma } from "./db.ts";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

export const bookingRouter = express.Router();
bookingRouter.use(express.json());

bookingRouter.get("/", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const query = await prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            bookings: true,
        },
    });
    if (!query) {
        return res.status(400).json({
            error: "User not found!",
        });
    }
    return res.status(200).json({ success: true, data: query.bookings });
});

bookingRouter.post("/createBooking", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { professional_id, date, time } = req.body;

    const sessionDuration = 45;
    const consultation_date = date as Date;
    const start_time = consultation_date;
    const end_time = consultation_date;
    end_time.setMinutes(end_time.getMinutes() + sessionDuration);
    const booking_time = new Date();

    // Check if there is already a consultation with that professional and date intersecting
    const queryCheck = await prisma.consultation.findMany({
        where: {
            professional_id: professional_id,
            date: date,
            start_time: {
                lte: end_time,
            },
            end_time: {
                gte: start_time,
            },
        },
    });

    if (queryCheck.length > 0) {
        return res.status(400).json({
            error: "There is already a consultation with that professional at that time range!",
        });
    }

    const query = await prisma.booking.create({
        data: {
            booking_time: booking_time,
            customer_id: user_id,
        },
    });

    if (!query) {
        return res.status(500).json({
            error: "Something went wrong while creating booking!",
        });
    }

    // Create consultation (45 minute consultation)
    const consultationQuery = await prisma.consultation.create({
        data: {
            booking_id: query.booking_id,
            date: date,
            start_time: start_time,
            end_time: end_time,
            professional_id: professional_id,
            customer_id: user_id,
        },
    });

    if (!consultationQuery) {
        return res.status(500).json({
            error: "Something went wrong while creating consultation!",
        });
    }

    // Create Chat Room for that Consultation
    const chatRoomQuery = await prisma.chat.create({
        data: {
            consultation_id: consultationQuery.consultation_id,
        },
    });

    if (!chatRoomQuery) {
        return res.status(500).json({
            error: "Something went wrong while creating chat room!",
        });
    }

    return res.status(201).json({ success: true });
});

bookingRouter.delete("/deleteBooking", async (req: CustomRequest, res: Response) => {
    const { booking_id } = req.body;

    const query = await prisma.booking.delete({
        where: {
            booking_id: booking_id,
        },
    });
    if (!query) {
        return res.status(400).json({
            error: "Booking not found!",
        });
    }

    return res.status(200).json({ success: true, data: query });
});
