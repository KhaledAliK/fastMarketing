const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads";
    if (file.fieldname === "imageUrl") {
      folder = "images";
    } else if (file.fieldname === "videoUrl") {
      folder = "videos";
    } else if (file.fieldname === "logoUrl") {
      folder = "logo";
    }
    cb(null, path.join(__dirname, `../${folder}`));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = function (req, file, cb) {
  if (file.fieldname === "imageUrl" || file.fieldname === "logoUrl") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported image format"), false);
    }
  } else if (file.fieldname === "videoUrl") {
    const allowedMimeTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported video format"), false);
    }
  } else {
    cb(new Error("Unexpected field: " + file.fieldname), false);
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, 
});

module.exports = upload;
