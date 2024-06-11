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
app.get("/delatt", async(Req:Request, res:Response)=>{
    const del3 = await prisma.chatMessage.deleteMany()
    const del2 = await prisma.chat.deleteMany();
    const del7 = await prisma.summary.deleteMany()
    const del5 = await prisma.payment.deleteMany();
    const del4 = await prisma.consultation.deleteMany()
    const del1 = await prisma.booking.deleteMany();
    const del6 =  await prisma.refreshToken.deleteMany()

   return res.status(200)
    
})

// Server start
const expressServer = app.listen(port, () => {
    console.log(`[Server]: Server is running at PORT:${port}`);
});

const ADMIN = "Admin";

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
