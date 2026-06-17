const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function transcodeToHLS( videoId, inputPath ) {
    try {
        console.log(videoId, inputPath);
        const outputDir = path.join(__dirname,'../output',videoId);

        fs.mkdirSync(outputDir,{
            recursive: true
        })

        const playlistPath = path.join(outputDir,"playlist.m3u8");

        return new Promise((resolve, reject) => {
            const ffmpeg = spawn( "ffmpeg",
                [
                    "-i",
                    inputPath,

                    "-vf",
                    "scale=-2:360",

                    "-c:v",
                    "libx264",

                    "-preset",
                    "fast",

                    "-hls_time",
                    "10",

                    "-hls_playlist_type",
                    "vod",

                    playlistPath
                ]
            );
            ffmpeg.stderr.on(
                "data",
                (data) => {
                    console.log(
                        data.toString()
                    );
                }
            );
            ffmpeg.on(
                "close",
                (code) => {

                    if (code === 0) {
                        resolve(outputDir);
                    }
                    else {
                        reject(
                          new Error(
                            "FFmpeg Failed"
                          )
                        );
                    }
                }
            );
            ffmpeg.on("error", (err) => {
                reject(new Error(`Failed to start FFmpeg: ${err.message}`));
            });

        });
    } catch(error) {
        console.log('❌ Error in Transcoding using FFMPEG Video', error.message);
        return Promise.reject(error);
    }
}


async function generateHLSVariant(inputPath, outputDir, resolution) {
    fs.mkdirSync(outputDir, { recursive: true });
    const playlistPath = path.join(outputDir, `playlist_${resolution}p.m3u8`);

    return new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
            "-i", inputPath,
            "-vf", `scale=-2:${resolution}`,   // dynamic resolution
            "-c:v", "libx264",
            "-preset", "fast",
            "-hls_time", "10",
            "-hls_playlist_type", "vod",
            playlistPath
        ]);

        ffmpeg.stderr.on("data", data => console.log(data.toString()));

        ffmpeg.on("close", code => {
            if (code === 0) resolve(playlistPath);
            else reject(new Error("FFmpeg failed"));
        });

        ffmpeg.on("error", err => reject(new Error(`Failed to start FFmpeg: ${err.message}`)));
    });
}

module.exports = {
    transcodeToHLS,
    generateHLSVariant,
}