import { Hono } from "hono";
import { cors } from "hono/cors";
import pairingRouter from "./routes/pairing.js";
import syncRouter from "./routes/sync.js";

const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/pair", pairingRouter);
app.route("/sync", syncRouter);

export default app;
