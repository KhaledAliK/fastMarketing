const cloudinary = require("cloudinary");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploadingImageBanner = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto", 
    });

    if (data && data.secure_url && data.public_id) {
      return {
        secure_url: data.secure_url,
        public_id: data.public_id,
      };
    } else {
      throw new Error("Failed to upload image: Missing secure_url or public_id.");
    }
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};


const cloudinaryDeletingImageBanner = async (imagePublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (error) {
    return error;
  }
};

module.exports = {
  cloudinaryUploadingImageBanner,
  cloudinaryDeletingImageBanner,
};
