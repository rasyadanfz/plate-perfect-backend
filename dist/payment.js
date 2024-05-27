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
import { PaymentMethod } from "@prisma/client";
export const paymentRouter = express.Router();
paymentRouter.use(express.json());
paymentRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const query = yield prisma.user.findFirst({
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
}));
paymentRouter.post("/createPayment", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
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
    const queryCheck = yield prisma.payment.findUnique({
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
    const query = yield prisma.payment.create({
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
}));
paymentRouter.delete("/deletePayment", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { payment_id } = req.body;
    const query = yield prisma.payment.delete({
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
}));
