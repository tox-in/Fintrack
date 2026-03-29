import { Router } from "express";
import { createExpense, deleteExpense, getAllExpenses, getDailySummary, getExpense, reverseExpense } from "../controllers/expense.controller";

const router = Router();

router.get("/daily-summary", getDailySummary);
router.get("/", getAllExpenses);
router.get("/:id", getExpense);
router.post("/", createExpense);
router.put("/:id", reverseExpense);
router.delete("/:id", deleteExpense);

export default router;