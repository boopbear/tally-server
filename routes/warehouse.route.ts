import express from "express";
import warehouseController from "../controllers/warehouse.controller";
import { verifyAccessToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const router = express.Router();

router.get("/items", verifyAccessToken, warehouseController.GetWarehouseItems);
router.get("/categories", verifyAccessToken, warehouseController.GetWarehouseItemCategories);
router.post("/item/create", verifyAccessToken, parseByMulter, warehouseController.CreateWarehouseItem);
router.post("/item/update", verifyAccessToken, parseByMulter, warehouseController.UpdateWarehouseItem);
router.post("/item/archive", verifyAccessToken, parseByMulter, warehouseController.ArchiveWarehouseItem);
router.post("/item/unarchive", verifyAccessToken, parseByMulter, warehouseController.UnarchiveWarehouseItem);
router.post("/item/hide", verifyAccessToken, parseByMulter, warehouseController.HideWarehouseItem);
router.get("/logs", verifyAccessToken, warehouseController.GetWarehouseLogs);
router.post("/transact/create", verifyAccessToken, parseByMulter, warehouseController.TransactWarehouseItem);
router.post("/transact/archive", verifyAccessToken, parseByMulter, warehouseController.ArchiveWarehouseTransactLog);
router.post("/transact/unarchive", verifyAccessToken, parseByMulter, warehouseController.UnarchiveWarehouseTransactLog);
router.post("/transact/hide", verifyAccessToken, parseByMulter, warehouseController.HideWarehouseTransactLog);

export default router;