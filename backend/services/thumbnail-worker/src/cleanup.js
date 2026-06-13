const fs = require("fs");

function cleanup(localVideoPath, outputDir) {
    try {
        if (localVideoPath && fs.existsSync(localVideoPath)) {
            fs.unlinkSync(localVideoPath);
            console.log(`Deleted temp file: ${localVideoPath}`);
        } else {
            console.log("File not found:", localVideoPath);
        }

        if (outputDir && fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
            console.log(`Deleted output directory: ${outputDir}`);
        } else {
            console.log("Directory not found:", outputDir);
        }
    } catch (err) {
        console.error("Cleanup Failed:", err.message);
    }
}

module.exports = {
    cleanup
};