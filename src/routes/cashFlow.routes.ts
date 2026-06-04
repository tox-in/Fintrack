import { Router } from "express";
import { createCashFlow, getAllCashFlows, getCashFlow, getCashFlowSummary, reverseCashFlow } from "../controllers/cashFlow.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from './../middleware/validate';
import { CreateCashflowSchema } from "../schemas/auth.schema";

const router = Router();
router.use(authenticate);

router.get("/summary", getCashFlowSummary);
router.get("/", getAllCashFlows);
router.get("/:id", getCashFlow);
router.post("/", validate(CreateCashflowSchema), createCashFlow);
router.delete("/:id", reverseCashFlow);

export default router;