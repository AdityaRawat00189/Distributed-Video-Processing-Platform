const fs = require("fs")
const path = require("path");
const minioClient = require("../../../shared/storage/minio");

async function downloadVideo(videoId, objectKey) {
    try {
        const tempDir = path.join(__dirname,"../temp");
        console.log(videoId, objectKey);

        if(!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, {
                recursive: true
            });
        }

        const localPath = path.join(tempDir,`${videoId}.mp4`);

        await minioClient.fGetObject(
            "videos",
            objectKey,
            localPath
        );

        console.log(`✅ Downloaded video to ${localPath} for Thumbnail worker`);

        return localPath;
    } catch (error) {
        console.log('❌ Error in Download Video while extracting Thumbnail', error.message);
    }
}

module.exports = {
    downloadVideo
}