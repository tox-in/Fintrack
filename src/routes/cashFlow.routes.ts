import { Router } from "express";
import { createCashFlow, getAllCashFlows, getCashFlow, getCashFlowSummary, reverseCashFlow } from "../controllers/cashFlow.controller";

const router = Router();

router.get("/summary", getCashFlowSummary);
router.get("/", getAllCashFlows);
router.get("/:id", getCashFlow);
router.post("/", createCashFlow);
router.delete("/:id", reverseCashFlow);

export default router;