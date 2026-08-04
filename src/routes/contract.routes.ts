import { Router } from "express";
import { createContract, deleteContract, getActiveContract, getAllContracts, getContract, getContractStats, updateContract } from "../controllers/contract.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { CreateContractSchema, UpdateContractSchema } from "../schemas/auth.schema";
const router = Router();
router.use(authenticate);

router.get("/active", authenticate, getActiveContract);
router.get("/stats", authenticate, getContractStats);
router.get("/", authenticate, getAllContracts);
router.get("/:id", authenticate, getContract);
router.post("/", validate(CreateContractSchema), createContract);
router.patch("/:id", validate(UpdateContractSchema), updateContract);
router.delete("/:id", deleteContract);

export  default router;