const prisma = require("../config/prisma");
const httpStatusText = require("../utils/httpStatusText");

module.exports.platformStatus = async (req, res, next) => {
  const { platformId } = req.params;
  try {
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return res
        .status(404)
        .json({ status: httpStatusText.FAIL, message: "Platform not found" });
    }

    if (!platform.status) {
      return res
        .status(400)
        .json({ status: httpStatusText.FAIL, message: "Platform is paused" });
    }

    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: httpStatusText.FAIL, message: "Internal server error" });
  }
};
