const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Simple API welcome route.
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Inventory Management API is running",
    endpoints: "/api/products"
  });
});

// Product API routes.
app.use("/api/products", productRoutes);

// Handle unknown routes and application errors.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

startServer();
