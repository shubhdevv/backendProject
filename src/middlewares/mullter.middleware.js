import multer from "multer";
import { uploadOnCloudinary } from "../utils/cloudinary";

const storage = multer.diskStorage({
    destination: function(req, res, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

export const upload = multer({storage,})