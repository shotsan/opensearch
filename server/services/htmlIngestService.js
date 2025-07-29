const { v4: uuidv4 } = require("uuid");
const { indexDocument } = require("./opensearchService");
const documentParser = require("./documentParser");
const RAKE = require("node-rake");

const ingestHTML = async (buffer, originalName, fileType, fileSize, uploadedBy) => {
  try {
    // Create temporary file to parse
    const fs = require("fs");
    const path = require("path");
    const tempPath = path.join(__dirname, "../../uploads", `temp-${uuidv4()}.html`);
    
    fs.writeFileSync(tempPath, buffer);
    
    // Parse HTML content
    const parsedContent = await documentParser.parseDocument(tempPath, fileType);
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    const content = parsedContent.content;
    
    // Validate content before processing
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('No valid content extracted from HTML file');
    }
    
    // Extract title
    const title = documentParser.extractTitle(content, originalName);
    
    // Extract tags using RAKE with proper error handling
    let tags = [];
    try {
      tags = RAKE.generate(content, {
        minLength: 3,
        maxLength: 4,
      }).slice(0, 10);
    } catch (rakeError) {
      console.warn('RAKE tag extraction failed, using fallback:', rakeError.message);
      // Fallback to simple word frequency
      const words = content.toLowerCase().split(/\s+/);
      const wordCount = {};
      words.forEach((word) => {
        const cleanWord = word.replace(/[^\w]/g, "");
        if (cleanWord.length > 3) {
          wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
      });
      tags = Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
    }
    
    // Create document object
    const document = {
      id: uuidv4(),
      title: title,
      content: content,
      filename: originalName,
      fileType: fileType,
      fileSize: fileSize,
      uploadedBy: uploadedBy,
      uploadedAt: new Date().toISOString(),
      tags: tags,
      pages: [
        {
          id: uuidv4(),
          pageNumber: 1,
          content: content,
          title: title,
        },
      ],
    };
    
    // Index in OpenSearch
    await indexDocument(document);
    
    return document.id;
  } catch (error) {
    console.error("Error ingesting HTML:", error);
    throw error;
  }
};

module.exports = {
  ingestHTML,
}; 