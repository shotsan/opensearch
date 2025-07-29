const pdfParse = require("pdf-parse");
const rake = require("node-rake");
const { v4: uuidv4 } = require("uuid");
const { indexDocument } = require("./opensearchService");

async function ingestPDF(buffer, filename, fileType, fileSize, uploadedBy) {
  let data;
  try {
    data = await pdfParse(buffer);
  } catch (error) {
    console.error('Failed to parse PDF:', error.message);
    throw new Error('Failed to parse PDF file');
  }

  // Ensure we have text content
  if (!data || !data.text || typeof data.text !== 'string') {
    throw new Error('No text content found in PDF');
  }

  const pages = data.text.split(/\f/).filter(Boolean);
  const doc_id = uuidv4();
  const uploadDate = new Date().toISOString();

  // Index each page
  for (let i = 0; i < pages.length; i++) {
    const content = pages[i].trim();
    if (!content || content.length < 10) continue; // Skip very short content
    
    // Extract tags using RAKE with error handling
    let tags = [];
    try {
      // Ensure content is a valid string and has sufficient length for RAKE
      if (typeof content === 'string' && content.length > 20) {
        tags = rake.generate(content);
        // Ensure tags is an array and has content
        if (!Array.isArray(tags) || tags.length === 0) {
          tags = [];
        }
        // Limit tags to first 10 to avoid overwhelming the index
        tags = tags.slice(0, 10);
      } else {
        console.warn(`Content too short for RAKE analysis on page ${i + 1}`);
        tags = [];
      }
    } catch (error) {
      console.warn(`Failed to extract tags for page ${i + 1}:`, error.message);
      // Fallback: extract basic keywords manually
      try {
        const words = content.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 3 && word.length < 20)
          .filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'from', 'they', 'will', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'than', 'first', 'water', 'after', 'where', 'called', 'about', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'].includes(word))
          .slice(0, 5);
        tags = words;
      } catch (fallbackError) {
        console.warn(`Fallback keyword extraction also failed for page ${i + 1}:`, fallbackError.message);
        tags = [];
      }
    }
    
    await indexDocument({
      doc_id,
      page_number: i + 1,
      content,
      tags,
      filename,
      fileType,
      fileSize,
      uploadDate,
      is_parent: false,
      metadata: {
        uploadedBy,
        uploadTimestamp: uploadDate,
      },
    });
  }

  // Index parent document (metadata only)
  await indexDocument({
    doc_id,
    filename,
    fileType,
    fileSize,
    uploadDate,
    is_parent: true,
    metadata: {
      uploadedBy,
      uploadTimestamp: uploadDate,
    },
  });

  return doc_id;
}

module.exports = { ingestPDF };
