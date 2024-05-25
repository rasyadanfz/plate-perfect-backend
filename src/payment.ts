import express, { Request, Response } from "express";
import { prisma } from "./db.ts";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";

export const paymentRouter = express.Router();
paymentRouter.use(express.json());

paymentRouter.get("/", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const query = await prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            payments: true,
        },
    });
    if (!query) {
        return res.status(400).json({
            error: "User not found!",
        });
    }

    return res.status(200).json({ success: true, data: query.payments });
});

paymentRouter.post("/createPayment", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { booking_id, amount, method } = req.body;

    const payment_time = new Date();

    // Create payment record
    const query = await prisma.payment.create({
        data: {
            payment_time: payment_time,
            booking_id: booking_id,
            amount: amount,
            method: method,
            customer_id: user_id,
        },
    });

    if (!query) {
        return res.status(500).json({
            error: "Something went wrong while creating payment!",
        });
    }

    return res.status(201).json({ success: true, data: query });
});

paymentRouter.delete("/deletePayment", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { payment_id } = req.body;

    const query = await prisma.payment.delete({
        where: {
            payment_id: payment_id,
        },
    });
    if (!query) {
        return res.status(400).json({
            error: "Payment not found!",
        });
    }
    return res.status(200).json({ success: true, data: query });
});
