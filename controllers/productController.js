const mongoose = require("mongoose");
const Product = require("../models/Product");

const allowedProductFields = [
  "name",
  "category",
  "price",
  "quantity",
  "sku",
  "description",
  "lowStockThreshold"
];

function pickAllowedFields(body) {
  const result = {};
  for (const field of allowedProductFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  }
  return result;
}

// POST /api/products
async function createProduct(req, res, next) {
  try {
    const product = await Product.create(pickAllowedFields(req.body));
    res.status(201).json({
      message: "Product created successfully",
      product
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products
async function getAllProducts(req, res, next) {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      minQuantity,
      maxQuantity,
      sort = "createdAt",
      order = "desc"
    } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const filter = {};

    if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: searchRegex }, { sku: searchRegex }, { description: searchRegex }];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (minQuantity !== undefined || maxQuantity !== undefined) {
      filter.quantity = {};
      if (minQuantity !== undefined) filter.quantity.$gte = Number(minQuantity);
      if (maxQuantity !== undefined) filter.quantity.$lte = Number(maxQuantity);
    }

    const allowedSortFields = ["name", "price", "quantity", "category", "createdAt"];
    const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      count: products.length,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      products
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/:id
async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
}

// PUT /api/products/:id
async function updateProduct(req, res, next) {
  try {
    const updates = pickAllowedFields(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide at least one valid product field to update" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/products/:id
async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product deleted successfully",
      product
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/products/:id/restock
async function restockProduct(req, res, next) {
  try {
    const amount = Number(req.body.quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: "Restock quantity must be a positive whole number" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: amount } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: `Successfully added ${amount} units to stock`,
      product
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/products/:id/sale
async function sellProduct(req, res, next) {
  try {
    const amount = Number(req.body.quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: "Sale quantity must be a positive whole number" });
    }

    // The quantity condition and decrement happen in one atomic database operation.
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, quantity: { $gte: amount } },
      { $inc: { quantity: -amount } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const existingProduct = await Product.findById(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.status(400).json({
        message: "Insufficient stock for this sale",
        availableQuantity: existingProduct.quantity
      });
    }

    res.status(200).json({
      message: `Sale recorded: ${amount} units`,
      product
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/reports/low-stock
async function getLowStockReport(req, res, next) {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] }
    }).sort({ quantity: 1, name: 1 });

    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/reports/category-summary
async function getCategorySummary(req, res, next) {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$price", "$quantity"] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restockProduct,
  sellProduct,
  getLowStockReport,
  getCategorySummary
};
