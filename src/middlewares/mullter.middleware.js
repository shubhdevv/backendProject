import multer from "multer";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const storage = multer.diskStorage({
    destination: function(req, res, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage });
export default upload; // ✅ default export
