const db = require("../db");

const addressColumns = `CustomerShippingAddressID, CustomerID,
  CustomerShippingAddressName, CustomerShippingAddressPhoneNo,
  CustomerShippingAddressEmailID, CustomerShippingAddressPinCode,
  CustomerShippingAddressFullAddress, CustomerShippingAddressLocality,
  CustomerShippingAddressCity, CustomerShippingAddressState,
  PostedDate, UpdatedBy, UpdatedOn`;

const getAddressValues = (body) => ({
  name: typeof body.CustomerShippingAddressName === "string"
    ? body.CustomerShippingAddressName.trim()
    : "",
  phone: typeof body.CustomerShippingAddressPhoneNo === "string"
    ? body.CustomerShippingAddressPhoneNo.trim()
    : "",
  email: typeof body.CustomerShippingAddressEmailID === "string"
    ? body.CustomerShippingAddressEmailID.trim()
    : "",
  pinCode: typeof body.CustomerShippingAddressPinCode === "string" ||
    typeof body.CustomerShippingAddressPinCode === "number"
    ? String(body.CustomerShippingAddressPinCode).trim()
    : "",
  fullAddress: typeof body.CustomerShippingAddressFullAddress === "string"
    ? body.CustomerShippingAddressFullAddress.trim()
    : "",
  locality: typeof body.CustomerShippingAddressLocality === "string"
    ? body.CustomerShippingAddressLocality.trim()
    : "",
  city: typeof body.CustomerShippingAddressCity === "string"
    ? body.CustomerShippingAddressCity.trim()
    : "",
  state: typeof body.CustomerShippingAddressState === "string"
    ? body.CustomerShippingAddressState.trim()
    : "",
  updatedBy: typeof body.UpdatedBy === "string"
    ? body.UpdatedBy.trim().slice(0, 50)
    : null,
});

const validateAddress = (address) => {
  const pinCode = Number(address.pinCode);
  return (
    address.name.length > 0 &&
    address.name.length <= 255 &&
    address.phone.length > 0 &&
    address.phone.length <= 255 &&
    address.email.length > 0 &&
    address.email.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email) &&
    /^\d+$/.test(address.pinCode) &&
    Number.isSafeInteger(pinCode) &&
    pinCode <= 2147483647 &&
    address.fullAddress.length > 0 &&
    address.fullAddress.length <= 255 &&
    address.locality.length > 0 &&
    address.locality.length <= 100 &&
    address.city.length > 0 &&
    address.city.length <= 100 &&
    address.state.length > 0 &&
    address.state.length <= 100
  );
};

exports.getCustomerShippingAddresses = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);
  if (!Number.isInteger(CustomerID) || CustomerID < 1) {
    return res.status(400).json({ success: false, message: "Invalid customer ID." });
  }
  db.query(
    `SELECT ${addressColumns} FROM mst_customershippingaddressdata
     WHERE CustomerID = ? ORDER BY CustomerShippingAddressID DESC`,
    [CustomerID],
    (error, rows) => {
      if (error) {
        console.error("Load customer shipping addresses error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to load shipping addresses.",
        });
      }
      return res.json({ success: true, data: rows });
    },
  );
};

exports.saveCustomerShippingAddress = (req, res) => {
  const CustomerID = Number(req.body.CustomerID);
  const addressID = req.body.CustomerShippingAddressID
    ? Number(req.body.CustomerShippingAddressID)
    : null;
  const address = getAddressValues(req.body);
  if (
    !Number.isInteger(CustomerID) ||
    CustomerID < 1 ||
    (addressID !== null && (!Number.isInteger(addressID) || addressID < 1)) ||
    !validateAddress(address)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter valid values for all required shipping address fields.",
    });
  }

  const values = [
    address.name,
    address.phone,
    address.email,
    Number(address.pinCode),
    address.fullAddress,
    address.locality,
    address.city,
    address.state,
    address.updatedBy,
  ];

  const save = () => {
    if (addressID) {
      db.query(
        `UPDATE mst_customershippingaddressdata
         SET CustomerShippingAddressName = ?, CustomerShippingAddressPhoneNo = ?,
             CustomerShippingAddressEmailID = ?, CustomerShippingAddressPinCode = ?,
             CustomerShippingAddressFullAddress = ?, CustomerShippingAddressLocality = ?,
             CustomerShippingAddressCity = ?, CustomerShippingAddressState = ?,
             UpdatedBy = ?, UpdatedOn = NOW()
         WHERE CustomerShippingAddressID = ? AND CustomerID = ?`,
        [...values, addressID, CustomerID],
        (error, result) => {
          if (error) {
            console.error("Update customer shipping address error:", error);
            return res.status(500).json({
              success: false,
              message: "Failed to save shipping address.",
            });
          }
          const respondSuccess = () =>
            res.json({
              success: true,
              message: "Shipping address updated successfully.",
              CustomerShippingAddressID: addressID,
            });
          if (result.affectedRows) return respondSuccess();
          db.query(
            `SELECT CustomerShippingAddressID FROM mst_customershippingaddressdata
             WHERE CustomerShippingAddressID = ? AND CustomerID = ? LIMIT 1`,
            [addressID, CustomerID],
            (lookupError, rows) => {
              if (lookupError) {
                console.error("Verify customer shipping address update error:", lookupError);
                return res.status(500).json({
                  success: false,
                  message: "Failed to verify shipping address.",
                });
              }
              if (!rows.length) {
                return res.status(404).json({
                  success: false,
                  message: "Shipping address not found for this customer.",
                });
              }
              return respondSuccess();
            },
          );
        },
      );
      return;
    }

    db.query(
      `INSERT INTO mst_customershippingaddressdata
       (CustomerID, CustomerShippingAddressName, CustomerShippingAddressPhoneNo,
        CustomerShippingAddressEmailID, CustomerShippingAddressPinCode,
        CustomerShippingAddressFullAddress, CustomerShippingAddressLocality,
        CustomerShippingAddressCity, CustomerShippingAddressState, UpdatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [CustomerID, ...values],
      (error, result) => {
        if (error) {
          console.error("Create customer shipping address error:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to save shipping address.",
          });
        }
        return res.status(201).json({
          success: true,
          message: "Shipping address added successfully.",
          CustomerShippingAddressID: result.insertId,
        });
      },
    );
  };

  db.query(
    "SELECT CustomerID FROM mst_customerdata WHERE CustomerID = ? LIMIT 1",
    [CustomerID],
    (error, rows) => {
      if (error) {
        console.error("Validate customer for shipping address error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to validate customer.",
        });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Customer not found." });
      }
      return save();
    },
  );
};

exports.deleteCustomerShippingAddress = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);
  const addressID = Number(req.params.CustomerShippingAddressID);
  if (
    !Number.isInteger(CustomerID) ||
    CustomerID < 1 ||
    !Number.isInteger(addressID) ||
    addressID < 1
  ) {
    return res.status(400).json({ success: false, message: "Invalid customer or address ID." });
  }
  db.query(
    `DELETE FROM mst_customershippingaddressdata
     WHERE CustomerShippingAddressID = ? AND CustomerID = ?`,
    [addressID, CustomerID],
    (error, result) => {
      if (error) {
        console.error("Delete customer shipping address error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to delete shipping address.",
        });
      }
      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "Shipping address not found for this customer.",
        });
      }
      return res.json({ success: true, message: "Shipping address deleted successfully." });
    },
  );
};
