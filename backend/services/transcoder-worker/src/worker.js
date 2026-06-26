const path = require("path");

const { connectRabbitMQ } = require('../../../shared/broker/connection');
const { VIDEO_TRANSCODED_QUEUE } = require('../../../shared/broker/queue');

const { connectRedis } = require("../../../shared/redis/client");
connectRedis();
const { acquireLock, releaseLock } = require("../../../shared/redis/distributedLock");

const Video = require('../../api-server/src/models/video');
const connectDB = require('../../api-server/src/config/mongo');  // Need to be shifted to Shared 
const { downloadVideo } = require('./downloader');
const { generateHLSVariant } = require('./ffmpeg');
const { uploadHLSFiles } = require('./uploader');
const { cleanup } = require('./cleanup');
const { publishVideoTranscoded } = require('../../../shared/broker/producers/thumbnailPublisher');
const { createMasterPlaylist } = require('./masterPlaylist');


async function transcodeToHLS(videoId, inputPath) {
    const baseOutput = path.join(__dirname, "../output", videoId);

    const variants = [
        { res: 360, dir: path.join(baseOutput, "360p") },
        { res: 720, dir: path.join(baseOutput, "720p") },
        { res: 1080, dir: path.join(baseOutput, "1080p") }
    ];

    // const results = [];
    const results = await Promise.all(
        variants.map(async (v) => {
            const playlist = await generateHLSVariant(inputPath,v.dir,v.res);

            return {
                resolution: `${v.res}p`,
                playlist
            };
        })
    );

    const masterPlaylist = createMasterPlaylist(videoId, baseOutput);

    return {output: baseOutput, masterPlaylist, varients: results}
}



async function startWorker() {
    try {
        connectDB();
        const channel = await connectRabbitMQ();
        console.log(`🎬 Worker started and connected to RabbitMQ`);

        // The outer try/catch only handles connecting to the queue
        channel.consume(VIDEO_TRANSCODED_QUEUE, async (msg) => {
            if (!msg) {
                console.warn(`⚠️ Received null message, skipping`);
                return;
            }

            // Move these INSIDE so they are unique to each message being processed
            let localVideoPath, outputDir; 

            // Key for the redis
            let lockKey;

            // Inner try/catch/finally handles the actual message processing
            try {
                const content = JSON.parse(msg.content.toString());
                console.log(`✅ Received message from queue ${VIDEO_TRANSCODED_QUEUE}:`, content);

                const { videoId, objectKey } = content;
                console.log(`videoId : ${videoId}`);

                lockKey = `lock:video:${videoId}`;
                const lockToken = await acquireLock(lockKey, 600);

                if (!lockToken) {
                    console.log("❌ Already Processing the Same Video");
                    channel.ack(msg);
                    return;
                }

                console.log("✅ LOCK ACQUIRED");
                msg.lockToken = lockToken;
                
                await Video.findByIdAndUpdate(videoId, {
                    status: "TRANSCODING"
                });

                localVideoPath = await downloadVideo(content);
                console.log(`✅ Video Downloaded Successfully at ${localVideoPath}`);

                // outputDir = await transcodeToHLS(videoId, localVideoPath);
                // console.log(`✅ HLS Generated at ${outputDir}`);
                const { output, masterPlaylist, variants} = await transcodeToHLS(videoId, localVideoPath);
                outputDir = output;
                console.log(`✅ HLS Varient Generated at ${outputDir}`);
                console.log("Master:", masterPlaylist);
                console.log("Variants:", variants);

                await uploadHLSFiles(videoId, outputDir);
                console.log(`✅ HLS Stored in minIO`);

                await Video.findByIdAndUpdate(videoId, { status: "DONE",
                    streamPath: `processed/${videoId}/master.m3u8`,

                    variants: [
                        {
                            resolution: "360p",
                            playlist: `processed/${videoId}/360p/playlist_360p.m3u8`
                        },
                        {
                            resolution: "720p",
                            playlist: `processed/${videoId}/720p/playlist_720p.m3u8`
                        },
                        {
                            resolution: "1080p",
                            playlist: `processed/${videoId}/1080p/playlist_1080p.m3u8`
                        }
                    ]
                });

                await Video.findByIdAndUpdate(videoId, {
                    status: "DONE",
                    streamPath: `processed/${videoId}/playlist.m3u8`
                });

                await publishVideoTranscoded({
                    videoId, objectKey
                });

                channel.ack(msg);
                
            } catch (error) {
                console.error(`❌ Message Processing Error: ${error.message}`);
                channel.nack(msg, false, false); 
            } finally {
                if (lockKey && msg.lockToken) {
                    console.log("✅ LOCK RELEASED");
                    await releaseLock(lockKey, msg.lockToken);
                }

                // This now runs after EACH individual video finishes or fails
                if (localVideoPath || outputDir) {
                    cleanup(localVideoPath, outputDir);
                    console.log(`🧹 Cleanup completed for video.`);
                }
            }
        });

    } catch (error) {
        // This catch handles failures to start the worker (e.g., RabbitMQ is down)
        console.error(`❌ Worker Startup Error: ${error.message}`);
    }
}

startWorker();