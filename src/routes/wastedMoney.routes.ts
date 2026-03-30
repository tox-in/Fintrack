import { Router } from "express";
import { createWastedMoney, deleteWastedMoney, getWastedMoneyById, getWastedStats, updateWastedMoney } from "../controllers/wastedMoney.controller";
import { getAllWastedMoney } from './../controllers/wastedMoney.controller';

const router = Router();

router.get("/stats", getWastedStats);
router.get("/", getAllWastedMoney);
router.get("/:id", getWastedMoneyById);
router.post("/", createWastedMoney);
router.patch("/:id", updateWastedMoney);
router.delete("/:id", deleteWastedMoney);

export default router;