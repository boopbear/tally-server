import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import userRouter from "./routes/user.route";
import departmentRouter from "./routes/department.route";
import postRouter from "./routes/posts.route";
import warehouseRouter from "./routes/warehouse.route";
import inventoryRouter from "./routes/inventory.route";
import requestRouter from "./routes/request.route";
import faqRouter from "./routes/faq.route";
import notifRouter from "./routes/notification.route";
import cookieParser from "cookie-parser";
import { verifyAccessToken } from "./routes/access.middleware";

export const prisma = new PrismaClient();
const app = express();

async function main() {
  // Middleware
  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({
    extended: true,
    limit: '40mb'
  }));
  app.use(morgan("dev"));
  app.use(
    cors({
      origin: [process.env.SERVER_URL || ''],
      credentials: true,
    })
  );

 // Health checker
  app.get("/api/health", (req: Request, res: Response) => {
    return res.status(200).json({
      status: "success",
      message: "Tally API web service is running",
    });
  });
   // Check if user is logged in
  app.get("/api/healthchecker", verifyAccessToken, (req: Request, res: Response) => {
    return res.status(200).json({
      status: "success",
      message: "Welcome to Tally API web service",
    });
  });

  // Register the API Routes
  app.use("/api", userRouter);
  app.use("/api", departmentRouter);
  app.use("/api", postRouter);
  app.use("/api/warehouse", warehouseRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api", requestRouter);
  app.use("/api/faq", faqRouter);
  app.use("/api/notification", notifRouter);

  // Catch All
  app.all("*", (req: Request, res: Response) => {
    return res.status(404).json({
      status: "fail",
      message: `Route: ${req.originalUrl} not found`,
    });
  });

  const PORT = 8000;
  app.listen(PORT, () => {
    console.info(`Server started on port: ${PORT}`);
  });
}

main()
  .then(async () => {
    await prisma.$connect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  }).finally(async () => {
    await prisma.$connect();
  });