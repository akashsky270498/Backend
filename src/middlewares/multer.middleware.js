import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});


const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "video/mp4",
        "video/quicktime", // mov
        "video/x-msvideo", // avi
    ];
    const isMimeTypeAllowed = allowedTypes.includes(file.mimetype); // <--- NOTICE: file.mimetype (NOT mimeType spelling mistake)
    
    if (isMimeTypeAllowed) {
        return cb(null, true);
    } else {
        cb(new Error("Only images & videos are allowed."));
    }
}

export const upload = multer({
    storage,
    fileFilter
})