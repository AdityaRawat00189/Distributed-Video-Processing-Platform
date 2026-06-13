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

// Get HLS stream with presigned URLs for segments
router.get('/stream/:id', async(req, res) => {
    try {
        const videoId = req.params.id;
        const video = await Video.findById(videoId);

        if(!video){
            return res.status(404)
            .json({
                error:"Video not found"
            });
        }

        if(video.status !== "DONE"){
            return res.status(400)
            .json({
                error:
                "Video still processing"
            });
        }

        console.log(`🔍 Fetching HLS playlist for streaming: ${videoId}`);

        try {
            // Fetch the playlist from MinIO
            const playlistStream = await minioClient.getObject(
                "videos",
                video.streamPath
            );

            let playlistContent = '';
            
            playlistStream.on('data', (chunk) => {
                playlistContent += chunk.toString();
            });

            playlistStream.on('end', async () => {
                try {
                    // Parse playlist and replace segment references with presigned URLs
                    const lines = playlistContent.split('\n');
                    const baseDir = `processed/${videoId}`;
                    const modifiedLines = [];

                    for (const line of lines) {
                        if (line && !line.startsWith('#') && line.trim()) {
                            // This is a segment filename
                            const segmentPath = `${baseDir}/${line.trim()}`;
                            const presignedUrl = await minioClient.presignedGetObject(
                                "videos",
                                segmentPath,
                                60 * 60 // 1 hour expiry
                            );
                            modifiedLines.push(presignedUrl);
                        } else {
                            modifiedLines.push(line);
                        }
                    }

                    const modifiedPlaylist = modifiedLines.join('\n');

                    res.set({
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    });
                    res.send(modifiedPlaylist);
                } catch (err) {
                    console.error(`❌ Error processing playlist: ${err.message}`);
                    res.status(500).json({ error: "Error processing playlist" });
                }
            });

            playlistStream.on('error', (err) => {
                console.error(`❌ Error reading playlist from MinIO: ${err.message}`);
                res.status(500).json({ error: "Error reading playlist" });
            });
        } catch (err) {
            console.error(`❌ Error accessing MinIO: ${err.message}`);
            res.status(500).json({ error: "Error accessing video stream" });
        }

    } catch (error) {
        console.error(`❌ Error in stream endpoint ${req.params.id}: ${error.message}`);
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

router.get('/delete', async(req, res) => {
    try {
        const result = await Video.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} videos`);
        res.json("Videos Deleted");
    } catch (error) {
        console.error(`❌ Error Deleting All videos: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

module.exports = router;