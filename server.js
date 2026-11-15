
import "dotenv/config";

import express from "express";
import webRoutes from "./routes/web.js";
import apiRoutes from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));

// Frontend static files
app.use(express.static("public"));

// Backend API
app.use("/api", apiRoutes);

// Frontend routes
app.use("/", webRoutes);

const server = app.listen(PORT, () => {
    console.log(`VerdeAI running at http://localhost:${PORT}`);
});

export default app;
export { server };
