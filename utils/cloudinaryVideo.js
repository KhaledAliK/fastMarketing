const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploadingVideo = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "video",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const cloudinaryDeletingVideo = async (videoPublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(videoPublicId, {
      resource_type: "video",
    });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  cloudinaryUploadingVideo,
  cloudinaryDeletingVideo,
};
