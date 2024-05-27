import express, { Response } from "express";
import { prisma } from "./db.js";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";
import { PaymentMethod } from "@prisma/client";

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
    let paymentMethod;
    switch (method) {
        case "CREDIT_CARD":
            paymentMethod = PaymentMethod.CREDIT_CARD;
            break;
        case "DEBIT_CARD":
            paymentMethod = PaymentMethod.DEBIT_CARD;
            break;
        case "CASH":
            paymentMethod = PaymentMethod.CASH;
            break;
        default:
            return res.status(400).json({
                error: "Invalid payment method!",
            });
    }

    // Check if that booking already has a payment
    const queryCheck = await prisma.payment.findUnique({
        where: {
            booking_id: booking_id,
        },
    });

    if (queryCheck) {
        return res.status(400).json({
            error: "That booking already has a payment!",
        });
    }

    // Create payment record
    const query = await prisma.payment.create({
        data: {
            payment_time: payment_time,
            booking_id: booking_id,
            amount: amount,
            method: paymentMethod,
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
