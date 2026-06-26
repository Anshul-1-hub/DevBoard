import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import "dotenv/config";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";
import issueRoutes from "./routes/issues.js";
import memberRoutes from "./routes/members.js";

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    }
})

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use("/api/issues", issueRoutes);
app.use("/api/issues", memberRoutes);

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
})

io.use(async (socket, next) => {
  try{
    const headers = new Headers();
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) headers.set("cookie", cookieHeader);

    const session = await auth.api.getSession({ headers });
    if (!session) return next(new Error("Unauthorized"));

    socket.data.userId = session.user.id;
    socket.data.userName = session.user.name ?? session.user.email;
    next();
  } 

  catch{
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("join-workspace", (orgId: string) => {
    socket.join(`workspace:${orgId}`);
  });

  socket.on("leave-workspace", (orgId: string) => {
    socket.leave(`workspace:${orgId}`);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`The server is listening on port ${PORT}`);
})