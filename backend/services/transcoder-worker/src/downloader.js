const path = require('path');
const fs = require('fs');

const minioClient = require('../../api-server/src/config/minio'); // Need to be shifted to Shared 

async function downloadVideo(videoData) {
    try {
        const {videoId, objectKey} = videoData;
        const tempDir = path.join(__dirname,'../temp');

        if(!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, {
                recursive: true
            });
        }

        const localPath = path.join(tempDir, `${videoId}.mp4`);

        await minioClient.fGetObject("videos",objectKey,localPath);

        console.log(`✅ Downloaded video to ${localPath}`);

        return localPath;

    } catch( error ){
        console.log('❌ Error in Download Video', error.message);
    }
}

module.exports = {
    downloadVideo,
}