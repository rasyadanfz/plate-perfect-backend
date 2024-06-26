import express, { Request, Response } from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { apiRouter, protectedApiRouter } from "./api.js";
import cors from "cors";
import { activateUser, getUserActiveRoom, userLeavesApp } from "./chatRoom.js";
import { Professional, User } from "@prisma/client";
import { buildAdminMsg, getUser } from "./helpers/chatHelper.js";
import { prisma } from "./db.js";

dotenv.config();
const fetchport = process.env.PORT || 3000;
const port = typeof fetchport === "string" ? parseInt(fetchport) : 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api", apiRouter); // Unprotected routes
app.use("/api", protectedApiRouter); // Protected routes
app.use(express.static(path.join(__dirname, "public")));

// Server start
const expressServer = app.listen(port, "0.0.0.0", () => {
    console.log(`[Server]: Server is running at PORT:${port}`);
});

// Websocket IO for Chats
const io = new Server(expressServer, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log(`[Server]: User Connected: ${socket.id}:${socket.handshake.address}`);

    // Listening for message event
    socket.on("message", (msg) => {
        console.log(msg);
        io.emit("message", msg);
    });

    // When user disconnects - to all others
    socket.on("disconnect", async (userId: string, role: string) => {
        const data = await userLeavesApp(userId);
        if (data) {
            const userData = role === "USER" ? (data[0] as User) : (data[0] as Professional);
            const prevChatRoom = data[1] as string;
            if (prevChatRoom) {
                io.to(prevChatRoom).emit("message", buildAdminMsg(`${userData.name} has left the room`));
            }
        }
    });
    socket.on("endByUser", async ({ id, role }: { id: string; role: string }) => {
        const getUserRoom = await getUserActiveRoom(id, role);
        if (getUserRoom) {
            socket.leave(getUserRoom);
            io.to(getUserRoom).emit("endByUser");
        }
    });

    socket.on("endByProfessional", async ({ id, role }: { id: string; role: string }) => {
        const getUserRoom = await getUserActiveRoom(id, role);
        if (getUserRoom) {
            socket.leave(getUserRoom);
            io.to(getUserRoom).emit("endByProfessional");
        }
    });

    socket.on("leaveRoom", async ({ id, role }: { id: string; role: string }) => {
        let user = await getUser(id);
        if (role === "USER") {
            await prisma.user.update({
                where: {
                    user_id: id,
                },
                data: {
                    currentChatRoom: null,
                },
            });
        } else {
            user = user as Professional;
            await prisma.professional.update({
                where: {
                    professional_id: id,
                },
                data: {
                    currentChatRoom: null,
                },
            });
        }
    });

    // Upon connection - only to user
    socket.emit("selfconnection", buildAdminMsg("Welcome to Consultation Room!"));
    socket.on(
        "enterRoom",
        async ({
            userId,
            name,
            roomId,
            role,
        }: {
            userId: string;
            name: string;
            roomId: string;
            role: string;
        }) => {
            // Leave previous room
            const prevRoom = await getUserActiveRoom(userId, role);
            if (prevRoom) {
                socket.leave(prevRoom);
                io.to(prevRoom).emit("message", buildAdminMsg(`${name} has left the consultation room`));
            }

            const user = await activateUser(userId, name, roomId);
            let userData;
            if (role === "USER") {
                userData = user as User;
            } else if (role === "PROFESSIONAL") {
                userData = user as Professional;
            }
            // Join room
            socket.join(userData!.currentChatRoom!);

            // To the user who joined
            socket.emit("message", buildAdminMsg("You have joined the consultation room"));

            // To everyone else
            socket.broadcast
                .to(roomId)
                .emit("message", buildAdminMsg(`${userData!.name} has joined the room`));
        }
    );

    // Upon connection - to all others
    socket.broadcast.emit("otherconnection", `User Connected: ${socket.id}`);

    // Listen for activity
    socket.on("activity", async (userId: string, role: string, name: string) => {
        const room = await getUserActiveRoom(userId, role);
        if (room) {
            socket.broadcast.to(room).emit("activity", name);
        }
    });
});

app.get("/", (req: Request, res: Response) => {
    res.send("Express Server is Running!");
});
