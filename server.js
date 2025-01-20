import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import routes from "../server/controller/controller.js"; // Importing the routes
import dotenv from "dotenv";
const app = express();
const PORT = 5000;
import cors from 'cors';
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

console.log("Mongo URI: ", process.env.MONGO_URI);
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url); // Current file path
const __dirname = path.dirname(__filename);    


app.use("/uploads", express.static(path.join(__dirname, "uploads"))) // Serve static files


// Routes
app.use("/api", routes); // Add all routes from controller.js

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
