import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`The server is listening on port ${PORT}`);
})