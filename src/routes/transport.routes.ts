import { Router } from "express";
import { createCard, getAllCards, getAllRecharges, getAllUsages, getCard, getTransportStats, recordRecharge, recordUsage } from "../controllers/transport.controller";

const router = Router();

router.get("/stats", getTransportStats);
router.get("/cards", getAllCards);
router.get("/cards/:id", getCard);
router.post("/cards", createCard);

router.get("/usages", getAllUsages);
router.post("/usages", recordUsage);

router.get("/recharges", getAllRecharges);
router.post("/recharges", recordRecharge);

export default router;