const fs = require('fs');
const PDFDocument = require('pdfkit');

function createTestPDF() {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        fs.writeFileSync('test-document.pdf', result);
        console.log('✅ Test PDF created successfully');
        resolve('test-document.pdf');
      });
      
      // Add content to PDF
      doc.fontSize(16).text('Test Document for Upload', 100, 100);
      doc.fontSize(12).text('This is a test document created for debugging PDF upload functionality.', 100, 150);
      doc.fontSize(12).text('It contains multiple lines of text to test parsing capabilities.', 100, 170);
      doc.fontSize(12).text('Date: ' + new Date().toISOString(), 100, 200);
      doc.fontSize(12).text('File: test-document.pdf', 100, 220);
      
      // Add some structured content
      doc.fontSize(14).text('Document Properties:', 100, 260);
      doc.fontSize(10).text('• File Type: PDF', 120, 280);
      doc.fontSize(10).text('• Created: For testing purposes', 120, 295);
      doc.fontSize(10).text('• Content: Text and formatting', 120, 310);
      doc.fontSize(10).text('• Purpose: Debug PDF upload functionality', 120, 325);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Run if called directly
if (require.main === module) {
  createTestPDF()
    .then(filename => {
      console.log(`📄 PDF saved as: ${filename}`);
      const stats = fs.statSync(filename);
      console.log(`📊 File size: ${stats.size} bytes`);
    })
    .catch(error => {
      console.error('❌ Error creating PDF:', error.message);
      process.exit(1);
    });
}

module.exports = { createTestPDF }; 