import { Router } from "express";
import { createWallet, deleteWallet, getAllWallets, getWallet, getWalletSummary, updateWallet } from "../controllers/wallet.controller";

const router = Router();

router.get("/summary", getWalletSummary);
router.get("/", getAllWallets);
router.get("/:id", getWallet);
router.post("/", createWallet);
router.patch("/:id", updateWallet);
router.delete("/:id", deleteWallet);

export default router;