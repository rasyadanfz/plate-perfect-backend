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
export const bookingRouter = express.Router();
bookingRouter.use(express.json());
bookingRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const query = yield prisma.user.findFirst({
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
}));
bookingRouter.post("/createBooking", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const { professional_id, date, time } = req.body;
    const sessionDuration = 45;
    const consultation_date = date;
    const start_time = consultation_date;
    const end_time = consultation_date;
    end_time.setMinutes(end_time.getMinutes() + sessionDuration);
    const booking_time = new Date();
    // Check if there is already a consultation with that professional and date intersecting
    const queryCheck = yield prisma.consultation.findMany({
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
    const query = yield prisma.booking.create({
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
    const consultationQuery = yield prisma.consultation.create({
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
    const chatRoomQuery = yield prisma.chat.create({
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
}));
bookingRouter.delete("/deleteBooking", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { booking_id } = req.body;
    const query = yield prisma.booking.delete({
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
}));
