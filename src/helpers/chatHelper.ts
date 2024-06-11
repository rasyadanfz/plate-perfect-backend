import { ReferenceSenderType } from "@prisma/client";
import { prisma } from "../db.js";
import { createId } from "@paralleldrive/cuid2";

export interface Message {
    sender_id?: string;
    sender_name: string;
    text: string;
    senderType: ReferenceSenderType;
}

export function buildMsg({ sender_id, sender_name, text, senderType }: Message) {
    return {
        sender_id,
        sender_name,
        text,
        created_at: new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        }).format(new Date()),
        senderType,
    };
}

export function buildAdminMsg(text: string) {
    return {
        message_id: createId(),
        name: "ADMIN",
        user_id: "ADMIN",
        content: text,
        created_at: new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        }).format(new Date()),
    };
}

export async function getUser(id: string) {
    const user = await prisma.user.findFirst({
        where: {
            user_id: id,
        },
    });

    if (!user) {
        const professional = await prisma.professional.findFirst({
            where: {
                professional_id: id,
            },
        });

        if (!professional) {
            return null;
        }
        return professional;
    }

    return user;
}
