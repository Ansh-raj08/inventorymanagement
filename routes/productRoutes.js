const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restockProduct,
  sellProduct,
  getLowStockReport,
  getCategorySummary
} = require("../controllers/productController");

const router = express.Router();

// Reports must be declared before /:id so "reports" is not treated as an ID.
router.get("/reports/low-stock", getLowStockReport);
router.get("/reports/category-summary", getCategorySummary);

router.post("/", createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/restock", restockProduct);
router.patch("/:id/sale", sellProduct);

module.exports = router;
