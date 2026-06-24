import express from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";
import issueRoutes from "./routes/issues.js"

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use("/api/issues", issueRoutes);

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
})

app.get("/api/me", requireAuth, (req, res) => {
    res.json({user: req.user});
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`The server is listening on port ${PORT}`);
})