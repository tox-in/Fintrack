import { Router } from "express";
import { getCurrentUser, login, register } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { LoginSchema, RegisterSchema } from "../schemas/auth.schema";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);
router.post("/refresh-token", (req, res) => {})
router.post("/logout", (req, res) => {})
router.get("/profile",authenticate, getCurrentUser);
router.patch("/profile", authenticate, (req, res) => {})
router.post("/change-password", authenticate, (req, res) => {})

export default router;