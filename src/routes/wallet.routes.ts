import { Router } from "express";
import {
  createWallet,
  deactivateWallet,
  deleteWallet,
  getAllWallets,
  getWallet,
  getWalletSummary,
  updateWallet,
} from "../controllers/wallet.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { CreateWalletSchema, UpdateWalletSchema } from "../schemas/auth.schema";

const router = Router();
router.use(authenticate);

router.get("/summary", getWalletSummary);
router.get("/", getAllWallets);
router.get("/:id", getWallet);
router.post("/", validate(CreateWalletSchema), createWallet);
router.patch("/:id", validate(UpdateWalletSchema), updateWallet);
router.delete("/:id", deleteWallet);
router.put("/:id", deactivateWallet);

export default router;
