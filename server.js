require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 7001; //Development Port

// Import Routes
const authRoutes = require("./routes/authRoutes");
const staticRoutes = require("./routes/staticRoutes");
const contactUsRoutes = require("./routes/contactUsRoutes");
const blogRoutes = require("./routes/blogRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const occasionRoutes = require("./routes/occasionRoutes");
const productRoutes = require("./routes/productRoutes");
const homePageRoutes = require("./routes/homePageRoutes");
const reportSummaryRoutes = require("./routes/reportSummaryRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const colorRoutes = require("./routes/colorRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerShippingAddressRoutes = require("./routes/customerShippingAddressRoutes");
const couponRoutes = require("./routes/couponRoutes");
const customerWishlistRoutes = require("./routes/customerWishlistRoutes");
const customerOrderRoutes = require("./routes/customerOrderRoutes");

// CORS Configuration
app.use(
  cors({ 
    origin: true,
    credentials: true,
  }),
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Assets
app.use(
  "/OnlineImages",
  express.static(path.join(__dirname, "uploads", "OnlineImages")),
);
app.use("/assets", express.static(path.join(__dirname, "uploads", "assets")));

// Modular Routes
app.use("/api/auth", authRoutes);
app.use("/api/page", staticRoutes);
app.use("/api/contact", contactUsRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/occasion", occasionRoutes);
app.use("/api/product", productRoutes);
app.use("/api/homepage", homePageRoutes);
app.use("/api/report", reportSummaryRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/color", colorRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/customer-shipping-address", customerShippingAddressRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/customer-wishlist", customerWishlistRoutes);
app.use("/api/customer-order", customerOrderRoutes);

app.listen(PORT, (err) => {
  if (err) {
    console.error(" Failed to start server:", err);
  } else {
    console.log(` Server running at http://localhost:${PORT}`);
  }
});
