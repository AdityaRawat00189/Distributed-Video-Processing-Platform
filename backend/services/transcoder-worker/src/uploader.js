const fs = require('fs');
const path = require('path');

const minioClient = require('../../../shared/storage/minio');

async function uploadDirectory(localDir, remoteDir) {
    const entries = fs.readdirSync(localDir, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const localPath = path.join(localDir, entry.name);

        if (entry.isDirectory()) {
            await uploadDirectory(localPath,`${remoteDir}/${entry.name}`);
        } else {
            const objectKey =`${remoteDir}/${entry.name}`;

            await minioClient.fPutObject("videos",objectKey,localPath);

            console.log(`✅ Uploaded ${objectKey}`);
        }
    }
}

async function uploadHLSFiles(videoId, outputDir) {
    await uploadDirectory(
        outputDir,
        `processed/${videoId}`
    );
}

module.exports = {
    uploadHLSFiles
};