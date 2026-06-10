const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB = require("./config/mongo");
const minioClient = require("./config/minio");
const { connectRabbitMQ } = require("../../../shared/broker/connection");
const setupTopology = require("../../../shared/broker/topology");

const uploadRoutes = require("./routes/upload");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Example MinIO bucket check
(async () => {
  const bucketName = "videos";
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1");
    console.log(`Bucket '${bucketName}' created.`);
  }
})();

// Connect to RabbitMQ and setup topology
async function initRabbitMQ() {
  const channel = await connectRabbitMQ();
  await setupTopology(channel);

  console.log(`✅ RabbitMQ Initialization Complete`);
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", uploadRoutes);

const PORT = process.env.PORT || 5000;

// Start server only after RabbitMQ is initialized
async function startServer() {
  try {
    await initRabbitMQ();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

startServer();
