import express from "express";
import notificationController from "../controllers/notification.controller";
import { verifyAccessToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const router = express.Router();

router.get("/all", verifyAccessToken, notificationController.GetNotifications);
router.post("/viewed", verifyAccessToken, parseByMulter, notificationController.AutoViewedNotification);
router.post("/hide", verifyAccessToken, parseByMulter, notificationController.HideNotification);

export default router;