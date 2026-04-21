import { Hono } from "hono";
import pairingRouter from "./routes/pairing.js";

const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/pair", pairingRouter);

export default app;
