const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const minioClient = require('../config/minio');
const Video = require('../models/video');

const router = express.Router();

const { publishVideoUploaded } = require('../../../../shared/broker/producers/videoPublisher');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        const allowed = [
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-matroska",
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"), false);
        }
    },
});

router.post('/upload', upload.single("video"), async (req, res) => {
    try {
        if(!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const title = req.body.title || path.parse(req.file.originalname).name;
        const description = req.body.description || "";

        const video = await Video.create({
            title,
            status: "UPLOADED",
            description,
            originalPath: "",
        });

        const extension = path.extname(req.file.originalname);
        const objectKey = `videos/${video._id}/original${extension}`;

        // Upload to MinIO
        await minioClient.fPutObject(
            "videos",
            objectKey,
            req.file.path
        );

        // Update video document with MinIO path
        video.originalPath = objectKey;
        await video.save();

        // Clean up local file
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error(`❌ Error deleting local file: ${err.message}`);
            }
        });

        // RabbitMQ publish 
        try {
            await publishVideoUploaded({
              videoId: video._id,
              objectKey
            });
            console.log(`✅ Successfully published video to queue: ${video._id}`);
        } catch (error) {
            console.error(`❌ Failed to publish to queue: ${error.message}`);
            throw error;
        }

        console.log(`✅ Video uploaded: ${video._id}`);

        return res.status(201).json({
            success: true,
            videoId: video._id,
            status: video.status,
        });

    } catch (error) {
        console.error(`❌ Error in video upload: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

router.get('/all', async(req, res) => {
    try {
        console.log(`🔍 Fetching all videos`);
        const videos = (await Video.find()); 
        console.log(`✅ Fetched ${videos.length} videos`);
        res.json({ videos });
    } catch (error) {
        console.error(`❌ Error fetching videos: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

module.exports = router;