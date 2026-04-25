import { Hono } from "hono";
import pairingRouter from "./routes/pairing.js";
import syncRouter from "./routes/sync.js";

const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/pair", pairingRouter);
app.route("/sync", syncRouter);

export default app;
