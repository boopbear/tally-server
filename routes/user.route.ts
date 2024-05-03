import express from "express";
import userController from "../controllers/user.controller";
import { verifyAccessToken, verifyLoginToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const router = express.Router();

router.get("/user/login", userController.LoginUser);
router.get("/user/logout", userController.LogoutUser);
router.get("/user/info", verifyAccessToken, userController.GetUserInfo);
router.get("/users", verifyAccessToken, userController.GetUsers);
router.post("/user/register", verifyAccessToken, parseByMulter, userController.RegisterUser);
router.post("/user/update", verifyAccessToken, parseByMulter, userController.UpdateUser);
router.post("/user/profile/update", verifyAccessToken, parseByMulter, userController.UpdateUserProfile);
router.post("/user/archive", verifyAccessToken, parseByMulter, userController.ArchiveUser);
router.post("/user/unarchive", verifyAccessToken, parseByMulter, userController.UnarchiveUser);
router.post("/user/hide", verifyAccessToken, parseByMulter, userController.HideUser);
router.post("/user/sync/google", verifyAccessToken, userController.GoogleSyncProfile);
router.post("/otp/generate", verifyLoginToken, userController.GenerateOTP);
router.get("/otp/verify", verifyLoginToken, userController.VerifyOTP);
// router.delete("/otp/remove", verifyAccessToken, userController.RemoveOTP);

export default router;