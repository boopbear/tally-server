import express from "express";
import postsController from "../controllers/posts.controller";
import { verifyAccessToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const postRouter = express.Router();

postRouter.post("/announcement/create", verifyAccessToken, parseByMulter, postsController.PostAnnouncement);
postRouter.post("/announcement/update", verifyAccessToken, parseByMulter, postsController.UpdateAnnouncement);
postRouter.post("/announcement/archive", verifyAccessToken, parseByMulter, postsController.ArchiveAnnouncement);
postRouter.get("/announcements", verifyAccessToken, postsController.GetAnnouncements);
postRouter.post("/discrepancy-report/create", verifyAccessToken, parseByMulter, postsController.PostDiscrepancyReport);
postRouter.post("/discrepancy-report/update", verifyAccessToken, parseByMulter, postsController.UpdateDiscrepancyReport);
postRouter.post("/discrepancy-report/archive", verifyAccessToken, parseByMulter, postsController.ArchiveDiscrepancyReport);
postRouter.get("/discrepancy-reports", verifyAccessToken, postsController.GetDiscrepancyReports);

export default postRouter;