import express, { Response } from "express";
import { prisma } from "./db.js";
import { CustomJWTPayload, CustomRequest } from "./types/index.js";
import { extractStartAndEndTime } from "./helper/booking.js";
import { decode } from "punycode";

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
    console.log(query);
    return res.status(200).json({ success: true, data: query.bookings });
});

bookingRouter.post("/createBooking", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    const { professional_id, dateOfAppointment } = req.body;

    const sessionDuration = 45;
    const consultation_date = dateOfAppointment.appointmentDate;
    const date = new Date(consultation_date);
    const decodeHour = extractStartAndEndTime(dateOfAppointment);
    const start_time = decodeHour.startTime;
    const end_time = decodeHour.endTime;
    const booking_time = new Date();

    console.log("dateOfAppointment", dateOfAppointment);
    console.log("DECODE HOUR", decodeHour);
    console.log("START TIME", start_time);
    console.log("END TIME", end_time);

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

    const professional = await prisma.professional.findUnique({
        where: {
            professional_id: professional_id,
        },
        select: {
            role: true,
        },
    });

    const bookingType = professional?.role === "CHEF" ? "Masakan" : "Gizi";

    const query = await prisma.booking.create({
        data: {
            booking_time: booking_time,
            customer_id: user_id,
            type: bookingType,
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
            customer_id: user_id,
            professional_id: professional_id,
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

    return res.status(201).json({ success: true, query: query });
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

bookingRouter.get("/userHistory", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;

    const query = await prisma.booking.findMany({
        where: {
            customer_id: user_id,
            status: "DONE",
        },
        orderBy: {
            booking_time: "desc",
        },
    });
    if (!query) {
        return res.status(400).json({
            error: "User Not Found!",
        });
    }

    return res.status(200).json({ success: true, data: query });
});

bookingRouter.get("/oneUserHistory", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;

    const query = await prisma.booking.findMany({
        where: {
            customer_id: user_id,
            status: "DONE",
        },
        orderBy: {
            booking_time: "desc",
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "User Not Found!",
        });
    }

    if (query.length === 0) {
        return res.status(200).json({ success: true, data: query });
    }

    return res.status(200).json({ success: true, data: query[0] });
});

bookingRouter.get("/onePaidBooking", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.user as CustomJWTPayload;
    console.log(user_id);

    const query = await prisma.booking.findMany({
        where: {
            customer_id: user_id,
            status: "PAID",
        },
        orderBy: {
            booking_time: "desc",
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "User Not Found!",
        });
    }

    if (query.length === 0) {
        return res.status(200).json({ success: true, data: query });
    }

    return res.status(200).json({ success: true, data: query });
});


bookingRouter.get("/finishedBooking", async(req:CustomRequest, res:Response)=>{
    const {user_id} = req.body;

    const query = await prisma.booking.findMany({
        where:{
            status:"DONE",
            customer_id:user_id
        }, orderBy:{
            booking_time:"desc",
        }
    })

    if(query){
        return res.status(200).json({
            success:true,
            data:query
        })
    }else res.status(400).json({error:"There is error"})
})

bookingRouter.get("/:book_id", async (req: CustomRequest, res: Response) => {
    const { user_id } = req.body;
    const { book_id } = req.params;

    const query = await prisma.booking.findFirst({
        where: {
            booking_id: book_id,
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "Booking not found!",
        });
    }

    return res.status(200).json({ success: true, data: query });
});

bookingRouter.put("/:book_id", async (req: CustomRequest, res: Response) => {
    const { status } = req.body;
    const { book_id } = req.params;

    const query = await prisma.booking.update({
        where: {
            booking_id: book_id,
        },
        data: {
            status: status,
        },
    });

    if (!query) {
        return res.status(400).json({
            error: "Booking update failed!",
        });
    }

    return res.status(200).json({ success: true, data: query });
});
