const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

class DocumentParser {
  constructor() {
    this.supportedTypes = {
      ".pdf": this.parsePDF,
      ".docx": this.parseDOCX,
      ".txt": this.parseTXT,
      ".html": this.parseHTML,
      ".htm": this.parseHTML,
    };
  }

  async parseDocument(filePath, fileType) {
    const extension = path.extname(filePath).toLowerCase();

    if (!this.supportedTypes[extension]) {
      throw new Error(
        `Unsupported file type: ${extension}. Supported types: ${Object.keys(this.supportedTypes).join(", ")}`,
      );
    }

    try {
      const content = await this.supportedTypes[extension](filePath);
      return {
        content: content,
        fileType: extension.substring(1),
        success: true,
      };
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async parseDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async parseTXT(filePath) {
    return fs.readFileSync(filePath, "utf8");
  }

  async parseHTML(filePath) {
    const htmlContent = fs.readFileSync(filePath, "utf8");
    
    // Extract text content from HTML (remove tags) - inline to avoid binding issues
    let text = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove style tags
      .replace(/<[^>]+>/g, ' ')                          // Remove all HTML tags
      .replace(/\s+/g, ' ')                              // Replace multiple spaces with single space
      .replace(/&nbsp;/g, ' ')                           // Replace HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    
    return text;
  }

  extractTitle(content, filename) {
    // Try to extract title from content
    const lines = content.split("\n").filter((line) => line.trim().length > 0);

    if (lines.length > 0) {
      // Look for a title in the first few lines
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length > 10 && line.length < 200) {
          // Check if it looks like a title (not too long, not too short)
          return line;
        }
      }
    }

    // Fallback to filename without extension
    return path.basename(filename, path.extname(filename));
  }

  extractTags(content) {
    const tags = [];
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = {};

    // Count word frequency
    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, "");
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });

    // Get top 10 most frequent words as tags
    const sortedWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return sortedWords;
  }

  getSupportedTypes() {
    return Object.keys(this.supportedTypes).map((ext) => ext.substring(1));
  }
}

module.exports = new DocumentParser();
