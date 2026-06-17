const fs = require("fs");
const path = require("path");

async function createMasterPlaylist(videoId, outputDir) {
    const masterContent = `#EXTM3U

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/playlist_360p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p/playlist_720p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist_1080p.m3u8
`;

    const masterPath = path.join(
        outputDir,
        "master.m3u8"
    );

    fs.writeFileSync(masterPath, masterContent);

    console.log(`✅ Master playlist created: ${masterPath}`);

    return masterPath;
}

module.exports = {
    createMasterPlaylist
};