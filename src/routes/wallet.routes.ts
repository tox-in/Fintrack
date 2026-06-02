import { Router } from "express";
import { createWallet, deleteWallet, getAllWallets, getWallet, getWalletSummary, updateWallet } from "../controllers/wallet.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/summary", getWalletSummary);
router.get("/", getAllWallets);
router.get("/:id", getWallet);
router.post("/", createWallet);
router.patch("/:id", updateWallet);
router.delete("/:id", deleteWallet);

export default router;