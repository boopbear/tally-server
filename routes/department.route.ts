import express from "express";
import departmentController from "../controllers/department.controller";
import { verifyAccessToken, verifyLoginToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const router = express.Router();

router.get("/departments", verifyAccessToken, departmentController.GetDepartments);
router.post("/department/create", verifyAccessToken, parseByMulter, departmentController.CreateDepartment);
router.post("/department/update", verifyAccessToken, parseByMulter, departmentController.UpdateDepartment);
router.post("/department/archive", verifyAccessToken, parseByMulter, departmentController.ArchiveDepartment);
router.post("/department/unarchive", verifyAccessToken, parseByMulter, departmentController.UnarchiveDepartment);
router.post("/department/hide", verifyAccessToken, parseByMulter, departmentController.HideDepartment);

export default router;