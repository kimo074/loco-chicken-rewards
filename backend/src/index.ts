import "dotenv/config";
import path from "path";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { startExpirySweep } from "./jobs/expireStale";
import { authRouter } from "./routes/auth";
import { locationsRouter } from "./routes/locations";
import { meRouter } from "./routes/me";
import { salesRouter } from "./routes/sales";
import { rewardsRouter } from "./routes/rewards";
import { redemptionsRouter } from "./routes/redemptions";
import { adminRouter } from "./routes/admin";
import { analyticsRouter } from "./routes/analytics";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

app.use("/api/auth", authRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/me", meRouter);
app.use("/api", salesRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api", redemptionsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/analytics", analyticsRouter);

app.use(errorHandler);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Loco Chicken backend listening on http://localhost:${PORT}`);
  startExpirySweep();
});
