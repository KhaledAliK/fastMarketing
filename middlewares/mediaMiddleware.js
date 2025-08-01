const photoUploading = require("./photoUploading");
const uploadVideo = require("./videoUploading");

const uploadMedia = (req, res, next) => {
  const mediaType = req.query.mediaType;
  if (!mediaType) {
    return res
      .status(400)
      .json({ message: "mediaType is required (image/video)" });
  }

  if (mediaType === "image") {
    return photoUploading.single("media")(req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "Image upload error" });
      }
      next();
    });
  } else if (mediaType === "video") {
    return uploadVideo.single("media")(req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "Video upload error" });
      }
      next();
    });
  } else {
    return res
      .status(400)
      .json({ message: "Invalid mediaType (must be image or video)" });
  }
};

module.exports = uploadMedia;
