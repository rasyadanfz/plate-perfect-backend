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
export const profileRouter = express.Router();
profileRouter.use(express.json());
profileRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const query = yield prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            email: true,
            name: true,
            country: true,
            age: true,
            gender: true,
            allergies: true,
            medicalRecords: true,
            date_of_birth: true,
            phone_num: true,
            hashedPassword: false,
            user_id: true,
        },
    });
    let professionalQuery;
    if (!query) {
        professionalQuery = yield prisma.professional.findFirst({
            where: {
                professional_id: user_id,
            },
            select: {
                professional_id: true,
                role: true,
                email: true,
                hashedPassword: false,
                name: true,
                phone_num: true,
                balance: true,
                experience: true,
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
profileRouter.put("/user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    console.log(user_id);
    const { email, name, country, age, gender, allergies, medicalRecords, DoB, phoneNum, firstCompleted, } = req.body;
    const query = yield prisma.user.update({
        where: {
            user_id: user_id,
        },
        data: {
            name: name,
            country: country,
            age: age,
            gender: gender,
            allergies: allergies,
            medicalRecords: medicalRecords,
            date_of_birth: DoB,
            phone_num: phoneNum,
            hasCompletedData: firstCompleted ? firstCompleted : true,
        },
    });
    if (!query) {
        return res.status(400).json({
            error: "User not found!",
        });
    }
    return res.status(200).json({ success: true });
}));
profileRouter.put("/professional", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const { name, role, phone_num, experience, description, firstCompleted, } = req.body;
    const query = yield prisma.professional.update({
        where: {
            professional_id: user_id,
        },
        data: {
            name: name,
            role: role,
            phone_num: phone_num,
            experience: experience,
            description: description,
            hasCompletedData: firstCompleted ? firstCompleted : true,
        },
    });
    if (!query) {
        return res.status(400).json({
            error: "User not found!",
        });
    }
    return res.status(200).json({ success: true });
}));
profileRouter.put("/professional/balance", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const { balance } = req.body;
    const currBalance = yield prisma.professional.findFirst({
        where: {
            professional_id: user_id,
        },
        select: {
            balance: true,
        },
    });
    const query = yield prisma.professional.update({
        where: {
            professional_id: user_id,
        },
        data: {
            balance: currBalance.balance + balance,
        },
    });
}));
