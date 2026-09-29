import { Hono } from "hono";
import { cors } from "hono/cors";
import pairingRouter from "./routes/pairing.js";
import syncRouter from "./routes/sync.js";
import { resolveAllowedOrigins } from "./lib/corsOrigins.js";

const allowedOrigins = resolveAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS, {
  nodeEnv: process.env.NODE_ENV,
});

const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "DELETE"],
    maxAge: 86400,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/pair", pairingRouter);
app.route("/sync", syncRouter);

export default app;
