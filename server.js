import express from "express";
import dotenv from "dotenv";
import webRoutes from "./routes/web.js";
import apiRoutes from "./routes/api.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));

// Static Assets
app.use(express.static("public"));
app.use("/css", express.static("css"));
app.use("/data", express.static("data"));

// Backend API Routes
app.use("/api", apiRoutes);

// Frontend Page Routing
app.use("/", webRoutes);

const server = app.listen(PORT, () => {
    console.log(`VerdeAI running at http://localhost:${PORT}`);
});

export default app;
export { server };
