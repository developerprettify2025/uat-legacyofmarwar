const express = require("express");
const router = express.Router();
const wishlistController = require("../API/customerWishlistController");
const verifyToken = require("../middleware/verifyToken");

router.get("/all-wishlists", verifyToken, wishlistController.getAllCustomerWishlists);
router.get("/customer/:CustomerID", wishlistController.getCustomerWishlist);
router.post("/", wishlistController.addProductToWishlist);
router.delete(
  "/customer/:CustomerID/product/:ProductID",
  wishlistController.removeProductFromWishlist,
);

module.exports = router;
