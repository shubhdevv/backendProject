import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: CLOUDINARY_API_KEY, 
        api_secret: CLOUDINARY_API_SECRET
    });

    const uploadOnCloudinary = async (localFilePath) => {
        try {
            if(!condition) {
                return null
            }
           const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
            //file uploaded
            console.log("file has been uploaded", response.url);
            return response;
        }
        catch (error) {
            fs.unlinkSync(localFilePath)
            //remove locally saved temporary file as the upload operation got failed
            return null
        }
    }

export {uploadOnCloudinary}