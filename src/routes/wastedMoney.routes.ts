import { Router } from "express";
import { createWastedMoney, deleteWastedMoney, getWastedMoneyById, getWastedStats, updateWastedMoney } from "../controllers/wastedMoney.controller";
import { getAllWastedMoney } from './../controllers/wastedMoney.controller';
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/stats", getWastedStats);
router.get("/", getAllWastedMoney);
router.get("/:id", getWastedMoneyById);
router.post("/", createWastedMoney);
router.patch("/:id", updateWastedMoney);
router.delete("/:id", deleteWastedMoney);

export default router;