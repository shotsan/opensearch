const { Storage } = require("@google-cloud/storage");

// Configure for local GCS emulator if running locally
const isLocal = process.env.NODE_ENV === 'development' && process.env.GCS_EMULATOR_HOST;
let storage;

if (isLocal) {
  // Use local GCS emulator
  storage = new Storage({
    apiEndpoint: `http://${process.env.GCS_EMULATOR_HOST}`,
    projectId: 'local-project',
    credentials: {
      client_email: 'local@local.com',
      private_key: 'local-key'
    }
  });
  console.log('Using local GCS emulator');
} else {
  // Use real Google Cloud Storage
  storage = new Storage();
  console.log('Using Google Cloud Storage');
}

const bucketName = process.env.GCS_BUCKET_NAME || "opensearch-documents-982591580949";
const bucket = storage.bucket(bucketName);

class CloudStorageService {
  async uploadFile(file, documentId) {
    try {
      const fileName = `${documentId}-${file.originalname}`;
      const fileBuffer = file.buffer;
      
      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        resumable: false
      });

      return new Promise((resolve, reject) => {
        blobStream.on("error", (error) => {
          console.error("Error uploading to Cloud Storage:", error);
          reject(error);
        });

        blobStream.on("finish", async () => {
          try {
            await blob.makePublic();
            const publicUrl = isLocal 
              ? `http://${process.env.GCS_EMULATOR_HOST}/${bucketName}/${fileName}`
              : `https://storage.googleapis.com/${bucketName}/${fileName}`;
            resolve({
              fileName,
              publicUrl,
              size: fileBuffer.length
            });
          } catch (error) {
            console.error("Error making file public:", error);
            // For local testing, continue even if makePublic fails
            const publicUrl = isLocal 
              ? `http://${process.env.GCS_EMULATOR_HOST}/${bucketName}/${fileName}`
              : `https://storage.googleapis.com/${bucketName}/${fileName}`;
            resolve({
              fileName,
              publicUrl,
              size: fileBuffer.length
            });
          }
        });

        blobStream.end(fileBuffer);
      });
    } catch (error) {
      console.error("Cloud Storage upload error:", error);
      throw error;
    }
  }

  async deleteFile(fileName) {
    try {
      await bucket.file(fileName).delete();
      console.log(`File ${fileName} deleted from Cloud Storage`);
    } catch (error) {
      console.error("Error deleting file from Cloud Storage:", error);
      throw error;
    }
  }
}

module.exports = new CloudStorageService();
