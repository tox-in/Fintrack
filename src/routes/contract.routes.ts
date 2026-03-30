import { Router } from "express";
import { createContract, deleteContract, getActiveContract, getAllContracts, getContract, updateContract } from "../controllers/contract.controller";

const router = Router();
router.get("/active", getActiveContract);
router.get("/", getAllContracts);
router.get("/:id", getContract);
router.post("/", createContract);
router.patch("/:id", updateContract);
router.delete("/:id", deleteContract);

export  default router;