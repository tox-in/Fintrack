import { Router } from "express";
import { createExpense, deleteExpense, getAllExpenses, getDailySummary, getExpense, reverseExpense } from "../controllers/expense.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/daily-summary", authenticate, getDailySummary);
router.get("/", authenticate, getAllExpenses);
router.get("/:id", authenticate, getExpense);
router.post("/", authenticate, createExpense);
router.put("/:id", authenticate, reverseExpense);
router.delete("/:id", authenticate, deleteExpense);

export default router;