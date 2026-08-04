import { Router } from "express";
import {
  getAllReceivables,
  getReceivableSummary,
  getReceivable,
  createReceivable,
  updateReceivable,
  deleteReceivable,
  recordPayment,
  getPayments,
} from "../controllers/receivable.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/summary", getReceivableSummary);
router.get("/", getAllReceivables);
router.get("/:id", getReceivable);
router.post("/", createReceivable);
router.patch("/:id", updateReceivable);
router.delete("/:id", deleteReceivable);

// Payment sub-routes
router.get("/:id/payments", getPayments);
router.post("/:id/payments", recordPayment);

export default router;
