import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Auto-detects image/video/etc
        });

        // Upload successful, remove local file
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

const extractPublicUrl = (url) => {
    const parts = url.split('/')
    const filename = parts.pop() || "";
    const publicId = filename.split('.')[0];
    return publicId;
}

const deleteFromCloundinary = async (publicId) => {
    return await cloudinary.uploader.destroy(publicId)
}

export { uploadOnCloudinary, extractPublicUrl, deleteFromCloundinary };
