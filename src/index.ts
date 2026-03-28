import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timeStamp: new Date(). toISOString() });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`\n FinTrack API running on http://localhost:${PORT}`);
    console.log(` Heath: http://localhost:${PORT}/health\n`);
    
});

export default app;