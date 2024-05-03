import express from "express";
import inventoryController from "../controllers/inventory.controller";
import { verifyAccessToken } from "./access.middleware";
import parseByMulter from "./multer.middleware";

const router = express.Router();

router.get("/categories", verifyAccessToken, inventoryController.GetInventoryCategoriesWithStatus);
router.get("/assets", verifyAccessToken, inventoryController.GetInventoryAssets);
router.get("/asset", verifyAccessToken, inventoryController.GetInventoryAssetBySharedId);
router.post("/asset/create", verifyAccessToken, parseByMulter, inventoryController.CreateAsset);
router.post("/asset/update", verifyAccessToken, parseByMulter, inventoryController.UpdateAsset);
router.post("/asset/archive", verifyAccessToken, parseByMulter, inventoryController.ArchiveAsset);
router.post("/asset/destroy", verifyAccessToken, parseByMulter, inventoryController.DestroyAsset);
router.post("/asset/unarchive", verifyAccessToken, parseByMulter, inventoryController.UnarchiveAsset);
router.post("/asset/transact", verifyAccessToken, parseByMulter, inventoryController.TransactAsset);

router.get("/asset/logs", verifyAccessToken, inventoryController.GetAssetLogs);
router.post("/asset/logs/destroy", verifyAccessToken, parseByMulter, inventoryController.DestroyLogs);

export default router;