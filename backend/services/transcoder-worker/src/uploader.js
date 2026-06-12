const fs = require('fs');
const path = require('path');

const minioClient = require('../../../shared/storage/minio');

async function uploadHLSFiles(
    videoId,
    outputDir
) {

    const files = fs.readdirSync(outputDir);

    for(const file of files){

        const filePath =
            path.join(
                outputDir,
                file
            );

        const objectKey =
            `processed/${videoId}/${file}`;

        await minioClient.fPutObject(
            "videos",
            objectKey,
            filePath
        );

        console.log(
            "Uploaded:",
            objectKey
        );
    }
}

module.exports = {
    uploadHLSFiles
};