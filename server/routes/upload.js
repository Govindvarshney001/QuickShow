import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

const router = express.Router();
const upload = multer(); // memory storage

// Ensure cloudinary is configured via environment variables
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env to enable uploads."
  );
}

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res
      .status(500)
      .json({ error: "Cloudinary not configured on server" });
  }

  try {
    const streamUpload = (buffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "quickshow" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

    const result = await streamUpload(req.file.buffer);
    return res.json({ url: result.secure_url, raw: result });
  } catch (err) {
    console.error("Upload failed:", err);
    return res
      .status(500)
      .json({ error: "Upload failed", detail: err?.message || String(err) });
  }
});

export default router;
