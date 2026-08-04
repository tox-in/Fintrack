import { Router } from "express";
import { createCashFlow, getAllCashFlows, getCashFlow, getCashFlowSummary, reverseCashFlow } from "../controllers/cashFlow.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from './../middleware/validate';
import { CreateCashflowSchema } from "../schemas/auth.schema";

const router = Router();
router.use(authenticate);

router.get("/summary",authenticate, getCashFlowSummary);
router.get("/", authenticate, getAllCashFlows);
router.get("/:id", authenticate, getCashFlow);
router.post("/", authenticate, validate(CreateCashflowSchema), createCashFlow);
router.delete("/:id", authenticate, reverseCashFlow);

export default router;