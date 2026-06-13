const { spawn } = require("child_process");

async function generateThumbnail( inputPath, outputPath ) {
    try {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn(
                "ffmpeg",
                [
                    "-i",
                    inputPath,

                    "-ss",
                    "00:00:05",

                    "-frames:v",
                    "1",

                    "-q:v",
                    "2",

                    outputPath
                ]
            );

            ffmpeg.on(
                "close",
                (code) => {

                    if(code === 0){
                        resolve(outputPath);
                    }
                    else{
                        reject(
                            new Error(
                                "Thumbnail generation failed"
                            )
                        );
                    }
                }
            );

        })
    } catch (error) {
        console.log('❌ Error in Thumbnail Generation ', error.message);
        return Promise.reject(error);
    }
}

module.exports = {
    generateThumbnail
}