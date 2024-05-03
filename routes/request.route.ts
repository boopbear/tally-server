import express from "express";
import requestsController from "../controllers/request.controller";
import { verifyAccessToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const router = express.Router();

router.get("/requests", verifyAccessToken, requestsController.GetAssetRequests);
router.post("/request/create", verifyAccessToken, parseByMulter, requestsController.CreateAssetRequest);
router.post("/request/answer", verifyAccessToken, parseByMulter, requestsController.AnswerRequest);
router.post("/request/close", verifyAccessToken, parseByMulter, requestsController.CloseRequest);
router.post("/request/hide", verifyAccessToken, parseByMulter, requestsController.HideRequest);

export default router;