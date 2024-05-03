import express from "express";
import faqController from "../controllers/faq.controller";
import { verifyAccessToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const router = express.Router();

router.get("/", verifyAccessToken, faqController.GetFaqContent);
router.post("/update", verifyAccessToken, parseByMulter, faqController.UpdateFaqContent);

export default router;