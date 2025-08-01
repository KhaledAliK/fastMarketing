const jwt = require("jsonwebtoken");
const httpStatusText = require("../utils/httpStatusText");
const prisma = require("../config/prisma");
require("dotenv").config();

// module.exports.authenticateUser = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) {
//     return res
//       .status(401)
//       .json({ message: "Access denied. No token provided" });
//   }
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(400).json({ message: "Invalid token" });
//   }
// };

module.exports.authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(400).json({ message: "Invalid token: No user id" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role || decoded.userType,
    };

    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid token" });
  }
};


module.exports.verifySuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: httpStatusText.FAIL,
        message: "Unauthorized. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.id },
    });

    if (!superAdmin) {
      return res.status(403).json({
        status: httpStatusText.FAIL,
        message: "Access denied. Only Super Admin can perform this action.",
      });
    }

    req.user = superAdmin;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: httpStatusText.FAIL,
        message: "Token expired. Please login again.",
      });
    }

    console.log(error);
    return res.status(500).json({
      status: httpStatusText.ERROR,
      message: "Internal server error.",
    });
  }
};

module.exports.verifySuperAdminOrSelf = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: httpStatusText.FAIL,
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Invalid token data",
      });
    }

    req.user = {
      id: String(decoded.id).trim(),
      role: decoded.role,
    };

    const { id } = req.params;
    console.log("🔹 Target User ID from Params:", id);
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }
    if (String(req.user.id) === String(id)) {
      return next();
    }
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to perform this action",
    });
  } catch (error) {
    console.error("Authorization Error:", error);
    return res.status(500).json({
      status: httpStatusText.FAIL,
      message: "Internal Server Error",
    });
  }
};

module.exports.protectAndAuthorizeSales = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Not authorized, no token provided",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user =
      (await prisma.superAdmin.findUnique({ where: { id: decoded.id } })) ||
      (await prisma.supervisor.findUnique({ where: { id: decoded.id } }));

    if (!user) {
      return res.status(403).json({
        status: httpStatusText.FAIL,
        message: "You do not have permission to manage Sales account",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Not authorized, invalid token",
    });
  }
};

module.exports.protectAndAuthorizeUserAccount = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Not authorized, no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.id },
    });
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: decoded.id },
    });
    const sales = await prisma.sales.findUnique({ where: { id: decoded.id } });
    const regularUser = await prisma.regularUser.findUnique({
      where: { id: decoded.id },
    });
    const user = superAdmin || supervisor || sales || regularUser;

    if (!user) {
      return res.status(403).json({
        status: httpStatusText.FAIL,
        message: "User not found or does not have permission",
      });
    }

    let userRole = "";
    if (superAdmin) userRole = "SUPER_ADMIN";
    else if (supervisor) userRole = "SUPERVISOR";
    else if (sales) userRole = "SALES";
    else if (regularUser) userRole = "REGULAR_USER";

    if (["SUPER_ADMIN", "SUPERVISOR"].includes(userRole)) {
      req.user = { id: user.id, role: userRole };
      return next();
    }

    if (req.params.id && req.params.id === user.id) {
      req.user = { id: user.id, role: userRole };
      return next();
    }

    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You do not have permission to manage other Sales accounts",
    });
  } catch (error) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Not authorized, invalid token",
    });
  }
};

