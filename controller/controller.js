import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import pixelmatch from "pixelmatch";
import { createCanvas } from "canvas";
import Image from "../model/imagemodel.js"; // Import Image model

const router = express.Router();

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Destination folder for uploads
    },
    filename: (req, file, cb) => {
        // Ensure the original name is preserved without random suffixes
        const originalName = file.originalname.replace(/\s+/g, "_"); // Replace spaces with underscores
        cb(null, originalName); // Use the original name directly
    },
});



const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

const upload = multer({
    dest: "uploads/", // Ensure the "uploads" folder exists and is writable
    limits: { fileSize: 5 * 1024 * 1024 }, // Optional: Limit file size to 5 MB
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type!"));
        }
    },
});

// Route to upload images
// router.post("/upload", upload.array("images", 50), async (req, res) => {
//     try {
//         if (!req.files || req.files.length === 0) {
//             return res.status(400).json({ message: "No files uploaded!" });
//         }

//         const processedFiles = [];
//         for (let file of req.files) {
//             const originalName = file.originalname.replace(/\s+/g, "_"); // Sanitize original name
//             const processedPath = `uploads/processed-${originalName}`;


//             // Resize and save the processed image
//             try {
//                 await sharp(file.path)
//                     .resize({ width: 500, height: 500, fit: "contain" })
//                     .toFile(processedPath);
//             } catch (error) {
//                 console.error("Error processing image with sharp:", error);
//                 return res.status(500).json({ message: "Error processing image!" });
//             }
//             // Save to the database
//             const newImage = new Image({
//                 name: originalName, // Save the sanitized original name
//                 processedName: `processed-${originalName}`,
//                 path: processedPath,
//                 similarityScore: 0,
//             });

//             await newImage.save();
//             processedFiles.push(newImage);
//         }

//         res.status(200).json({
//             message: "Files uploaded and processed successfully!",
//             files: processedFiles,
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Error processing files!", error: error.message });
//     }
// });

router.post("/upload", upload.array("images", 50), async (req, res) => {
    try {
        console.log("Uploaded files:", req.files);
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded!" });
        }

        const processedFiles = [];
        for (let file of req.files) {
            const originalName = file.originalname.replace(/\s+/g, "_"); // Sanitize original name
            const processedPath = `uploads/processed-${originalName}`;

            // Resize and save the processed image
            try {
                await sharp(file.path)
                    .resize({ width: 500, height: 500, fit: "contain" })
                    .toFile(processedPath);
            } catch (error) {
                console.error("Error processing image with sharp:", error);
                return res.status(500).json({ message: "Error processing image!" });
            }

            // Save to the database
            const newImage = new Image({
                name: originalName, // Save the sanitized original name
                processedName: `processed-${originalName}`,
                path: processedPath, // Save the path for future comparison
                similarityScore: 0,
            });

            await newImage.save();
            processedFiles.push(newImage);
        }

        res.status(200).json({
            message: "Files uploaded and processed successfully!",
            files: processedFiles,
        });
    } catch (error) {
        res.status(500).json({ message: "Error processing files!", error: error.message });
    }
});




// Route to get all images
router.get("/images", async (req, res) => {
    try {
        const images = await Image.find();
        if (images.length === 0) {
            return res.status(404).json({ message: "No images uploaded yet!" });
        }

        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving images!", error: error.message });
    }
});



// Route to compare images
// router.post("/image", upload.single("image"), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: "No image uploaded!" });
//         }

//         // Process and resize the query image
//         const queryImagePath = path.resolve("uploads", `processed-${req.file.originalname.replace(/\s+/g, "_")}`);
//         await sharp(req.file.path)
//             .resize({ width: 500, height: 500, fit: "contain" })
//             .toFile(queryImagePath);

//         const queryImageBuffer = await sharp(queryImagePath).raw().toBuffer();
//         const queryWidth = 500;
//         const queryHeight = 500;

      
//         // Fetch all database images
//         const images = await Image.find();
//         if (images.length === 0) {
//             return res.status(404).json({ message: "No images available for comparison!" });
//         }

//         for (let img of images) {
//             try {
//                 // Resize the database image and get the buffer
//                 const imgBuffer = await sharp(img.path).resize(500, 500).raw().toBuffer();

//                 // Validate buffer size
//                 if (queryImageBuffer.length !== imgBuffer.length) {
//                     console.warn(`Skipping image ID ${img._id}: Buffer sizes do not match.`);
//                     continue;
//                 }

//                 // Create canvas for pixelmatch
//                 const canvas = createCanvas(queryWidth, queryHeight);
//                 const context = canvas.getContext("2d");
//                 const diff = context.createImageData(queryWidth, queryHeight);

//                 // Compare images and calculate similarity score
//                 const diffPixels = pixelmatch(queryImageBuffer, imgBuffer, diff.data, queryWidth, queryHeight, { threshold: 0.1 });
//                 const similarityScore = 1 - diffPixels / (queryWidth * queryHeight);

//                 console.log(`Image ID ${img._id}: Similarity score = ${similarityScore}`);
//                 await Image.findByIdAndUpdate(img._id, { similarityScore });
//             } catch (err) {
//                 console.error(`Error processing image ID ${img._id}: ${err.message}`);
//             }
//         }

//         // Retrieve and sort images by similarity score
//         const sortedImages = await Image.find().sort({ similarityScore: -1 });
//         res.status(200).json(sortedImages);
//     } catch (error) {
//         console.error("Error comparing images:", error.message);
//         res.status(500).json({ message: "Error comparing images!", error: error.message });
//     }
// });

// Route to compare images

router.post("/image", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded!" });
        }

        const queryImagePath = path.resolve("uploads", `processed-${req.file.originalname.replace(/\s+/g, "_")}`);
        await sharp(req.file.path)
            .resize({ width: 500, height: 500, fit: "contain" })
            .toFile(queryImagePath);

        const queryImageBuffer = await sharp(queryImagePath).raw().toBuffer();
        const queryWidth = 500;
        const queryHeight = 500;

        const images = await Image.find();

        for (let img of images) {
            const imgBuffer = await sharp(img.path).raw().toBuffer();
            const canvas = createCanvas(queryWidth, queryHeight);
            const context = canvas.getContext("2d");
            const diff = context.createImageData(queryWidth, queryHeight);

            const diffPixels = pixelmatch(queryImageBuffer, imgBuffer, diff.data, queryWidth, queryHeight, { threshold: 0.3 });

            img.similarityScore = 1 - diffPixels / (queryWidth * queryHeight);
            await Image.findByIdAndUpdate(img._id, { similarityScore: img.similarityScore });
        }

        const sortedImages = images.sort((a, b) => b.similarityScore - a.similarityScore);
        res.status(200).json(sortedImages);
    } catch (error) {
        res.status(500).json({ message: "Error comparing images!", error: error.message });
    }
});






// route to delete
router.delete("/images/:id", async (req, res) => {
    try {
        const uniqueId = req.params.id.trim();
      console.log("Received delete request for ID:", uniqueId); // Debug log
  
      const image = await Image.findById(uniqueId);

      if (!image) {
        console.error("Image not found for ID:", uniqueId); // Debug log
        return res.status(404).json({ message: "Image not found!" });
      }
  
      console.log("Image found:", image); // Debug the image details
  
      fs.unlink(image.path, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Error deleting file from server!", error: err.message });
        }
  
        await Image.findByIdAndDelete(uniqueId);
        console.log("Image deleted successfully:", uniqueId);
        res.status(200).json({ message: "Image deleted successfully!" });
      });
    } catch (error) {
      console.error("Error deleting image:", error.message);
      res.status(500).json({ message: "Error deleting image!", error: error.message });
    }
  });
  
  

export default router;
  