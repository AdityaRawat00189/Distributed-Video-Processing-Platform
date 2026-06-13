// thumbnail-worker/src/uploader.js

const minioClient =
require("../../../shared/storage/minio");

async function uploadThumbnail(
    videoId,
    thumbnailPath
){

    const objectKey =
        `thumbnails/${videoId}.jpg`;

    await minioClient.fPutObject(
        "videos",
        objectKey,
        thumbnailPath
    );

    return objectKey;
}

module.exports = {
    uploadThumbnail
};