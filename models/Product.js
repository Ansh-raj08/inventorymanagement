const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must contain at least 2 characters"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number"
      }
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, "Low-stock threshold cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Low-stock threshold must be a whole number"
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
