import express, { Request, Response } from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { apiRouter, protectedApiRouter } from "./api.ts";

dotenv.config();
const port = process.env.SERVER_PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use("/api", apiRouter); // Unprotected routes
app.use("/api", protectedApiRouter); // Protected routes
app.use(express.static(path.join(__dirname, "public")));

// Server start
const expressServer = app.listen(port, () => {
    console.log(`[Server]: Server is running at http://localhost:${port}`);
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
    socket.on("disconnect", (reason) => {
        socket.broadcast.emit("otherconnection", `User disonnected: ${socket.id}`);
        console.log(`[Server]: User Disconnected: ${socket.id}`);
    });

    // Upon connection - only to user
    socket.emit("selfconnection", "Welcome to Chat App!");

    // Upon connection - to all others
    socket.broadcast.emit("otherconnection", `User Connected: ${socket.id}`);

    // Listen for activity
    socket.on("activity", (name) => {
        socket.broadcast.emit("activity", name);
    });
});

app.get("/", (req: Request, res: Response) => {
    res.send("Express Server is Running!");
});
