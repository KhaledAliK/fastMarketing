const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const prisma = require("../config/prisma");
const httpStatusText = require("../utils/httpStatusText");
const {
  cloudinaryUploadingImage,
  cloudinaryDeletingImage,
} = require("../utils/cloudinary");

/**
 * @method POST
 * @route ~api/user/any-user/upload-profile-photo
 * @desc User upload profile photo
 */
// module.exports.uploadProfilePhotoCtrl = asyncHandler(async (req, res) => {
//   const userId = req.user?.id;
//   if (!userId) {
//     return res.status(401).json({
//       status: httpStatusText.FAIL,
//       message: "Unauthorized: User not authenticated",
//     });
//   }

//   let userTables = ["superAdmin", "supervisor", "sales", "regularUser"];
//   let user = null;
//   let userType = null;

//   for (const table of userTables) {
//     user = await prisma[table].findUnique({ where: { id: userId } });

//     if (user) {
//       userType = table;
//       break;
//     }
//   }

//   if (!user) {
//     return res.status(404).json({
//       status: httpStatusText.FAIL,
//       message: "User not found",
//     });
//   }

//   if (user.id !== userId) {
//     return res.status(403).json({
//       status: httpStatusText.FAIL,
//       message: "Forbidden: You can only update your own profile photo",
//     });
//   }

//   if (!req.file) {
//     return res.status(400).json({
//       status: httpStatusText.FAIL,
//       message: "No file provided",
//     });
//   }

//   const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
//   const result = await cloudinaryUploadingImage(imagePath);

//   if (user.profilePhoto && user.profilePhoto.publicId) {
//     await cloudinaryDeletingImage(user.profilePhoto.publicId);
//   }

//   await prisma[userType].update({
//     where: { id: userId },
//     data: {
//       profilePhoto: {
//         url: result.secure_url,
//         publicId: result.public_id,
//       },
//     },
//   });
//   fs.unlinkSync(imagePath);
//   res.status(200).json({
//     status: httpStatusText.SUCCESS,
//     message: "Your profile photo uploaded successfully.",
//     profilePhoto: {
//       url: result.secure_url,
//       publicId: result.public_id,
//     },
//   });
// });

module.exports.uploadProfilePhotoCtrl = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  const targetUserId = req.params.id;

  if (!currentUserId) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  if (currentUserRole !== 'SUPER_ADMIN' && currentUserId !== targetUserId) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "Forbidden: You can only upload your own profile photo",
    });
  }

  // const currentUser = await prisma.superAdmin.findUnique({
  //   where: { id: currentUserId },
  // });

  // const isSuperAdmin = !!currentUser;

  // if (!isSuperAdmin && currentUserId !== targetUserId) {
  //   return res.status(403).json({
  //     status: httpStatusText.FAIL,
  //     message: "Forbidden: You can only upload your own profile photo",
  //   });
  // }

  let userTables = ["superAdmin", "supervisor", "sales", "regularUser"];
  let user = null;
  let userType = null;

  for (const table of userTables) {
    user = await prisma[table].findUnique({ where: { id: targetUserId } });
    if (user) {
      userType = table;
      break;
    }
  }

  if (!user) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "User not found",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "No file provided",
    });
  }

  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadingImage(imagePath);

  if (user.profilePhoto?.publicId) {
    await cloudinaryDeletingImage(user.profilePhoto.publicId);
  }

  await prisma[userType].update({
    where: { id: targetUserId },
    data: {
      profilePhoto: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    },
  });

  fs.unlinkSync(imagePath);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Your profile photo uploaded successfully.",
    profilePhoto: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
});
