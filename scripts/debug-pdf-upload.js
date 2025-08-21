const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const logger = require('../utils/logger');
const errorHandler = require('../utils/errorHandler');

// Test configuration
const BACKEND_URL = 'https://backend-dot-opensearch-doc-search.uc.r.appspot.com';

class PDFUploadDebugger {
  constructor() {
    this.testResults = [];
  }

  async debugPDFUpload() {
    console.log('🔍 Starting PDF Upload Debug Session\n');
    
    const tests = [
      { name: 'Simple PDF Creation', fn: this.testSimplePDFCreation.bind(this) },
      { name: 'PDF Buffer Validation', fn: this.testPDFBufferValidation.bind(this) },
      { name: 'Backend Health Check', fn: this.testBackendHealth.bind(this) },
      { name: 'PDF Upload Request', fn: this.testPDFUploadRequest.bind(this) },
      { name: 'Backend Logs Analysis', fn: this.testBackendLogsAnalysis.bind(this) },
      { name: 'PDF Parsing Simulation', fn: this.testPDFParsingSimulation.bind(this) }
    ];

    for (const test of tests) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔍 Running: ${test.name}`);
      console.log(`${'='.repeat(50)}`);
      
      try {
        const result = await test.fn();
        this.testResults.push({ name: test.name, passed: true, result });
        console.log(`✅ ${test.name}: PASSED`);
      } catch (error) {
        this.testResults.push({ name: test.name, passed: false, error: error.message });
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      }
    }

    this.generateReport();
  }

  async testSimplePDFCreation() {
    console.log('Creating test PDF file...');
    
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    const testFilePath = 'debug-test.pdf';
    fs.writeFileSync(testFilePath, pdfContent);
    
    const stats = fs.statSync(testFilePath);
    console.log(`PDF created: ${testFilePath} (${stats.size} bytes)`);
    
    return { filePath: testFilePath, size: stats.size };
  }

  async testPDFBufferValidation() {
    console.log('Validating PDF buffer...');
    
    const testFilePath = 'debug-test.pdf';
    if (!fs.existsSync(testFilePath)) {
      throw new Error('Test PDF file not found');
    }

    const buffer = fs.readFileSync(testFilePath);
    console.log(`Buffer size: ${buffer.length} bytes`);
    console.log(`Buffer type: ${typeof buffer}`);
    console.log(`Is Buffer: ${Buffer.isBuffer(buffer)}`);
    
    // Check PDF header
    const header = buffer.toString('ascii', 0, 8);
    console.log(`PDF header: "${header}"`);
    
    if (!header.startsWith('%PDF')) {
      throw new Error('Invalid PDF header');
    }

    return { bufferSize: buffer.length, header };
  }

  async testBackendHealth() {
    console.log('Checking backend health...');
    
    const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 10000 });
    console.log(`Backend status: ${response.status}`);
    console.log(`Backend response:`, response.data);
    
    return response.data;
  }

  async testPDFUploadRequest() {
    console.log('Testing PDF upload request...');
    
    const testFilePath = 'debug-test.pdf';
    if (!fs.existsSync(testFilePath)) {
      throw new Error('Test PDF file not found');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'debug-test.pdf',
      contentType: 'application/pdf'
    });

    console.log('FormData created with file');
    console.log('File details:', {
      filename: 'debug-test.pdf',
      contentType: 'application/pdf',
      size: fs.statSync(testFilePath).size
    });

    console.log('Sending upload request...');
    const startTime = Date.now();

    try {
      const response = await axios.post(`${BACKEND_URL}/api/documents/upload`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const endTime = Date.now();
      console.log(`Upload successful! Time: ${endTime - startTime}ms`);
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      return {
        success: true,
        duration: endTime - startTime,
        documentId: response.data.document?.id
      };

    } catch (error) {
      const endTime = Date.now();
      console.log(`Upload failed! Time: ${endTime - startTime}ms`);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Error message:', error.message);
      
      throw new Error(`Upload failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
  }

  async testBackendLogsAnalysis() {
    console.log('Analyzing backend logs...');
    
    // This would typically query Cloud Logging or similar
    // For now, we'll simulate log analysis
    console.log('Backend logs analysis would be performed here');
    console.log('Looking for PDF parsing errors, timeouts, etc.');
    
    return { logAnalysis: 'simulated' };
  }

  async testPDFParsingSimulation() {
    console.log('Simulating PDF parsing locally...');
    
    try {
      const pdfParse = require('pdf-parse');
      const testFilePath = 'debug-test.pdf';
      
      if (!fs.existsSync(testFilePath)) {
        throw new Error('Test PDF file not found');
      }

      const buffer = fs.readFileSync(testFilePath);
      console.log('Attempting to parse PDF with pdf-parse...');
      
      const data = await pdfParse(buffer);
      console.log('PDF parsing successful!');
      console.log('Text length:', data.text.length);
      console.log('Page count:', data.numpages);
      console.log('Info:', data.info);
      
      return {
        success: true,
        textLength: data.text.length,
        pageCount: data.numpages,
        info: data.info
      };

    } catch (error) {
      console.log('PDF parsing failed locally:', error.message);
      throw new Error(`Local PDF parsing failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PDF UPLOAD DEBUG REPORT');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    console.log(`\n📈 Test Results: ${passed} passed, ${failed} failed\n`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n🔍 Analysis:');
    
    if (failed === 0) {
      console.log('✅ All tests passed - PDF upload should work');
    } else {
      console.log('❌ Some tests failed - Issues identified:');
      
      this.testResults.forEach(result => {
        if (!result.passed) {
          console.log(`   - ${result.name}: ${result.error}`);
        }
      });
    }

    console.log('\n💡 Recommendations:');
    
    const failedTests = this.testResults.filter(r => !r.passed);
    failedTests.forEach(result => {
      switch (result.name) {
        case 'Simple PDF Creation':
          console.log('   - Check file system permissions');
          break;
        case 'PDF Buffer Validation':
          console.log('   - Verify PDF file integrity');
          break;
        case 'Backend Health Check':
          console.log('   - Backend may be down or misconfigured');
          break;
        case 'PDF Upload Request':
          console.log('   - Check backend PDF parsing logic');
          console.log('   - Verify multer configuration');
          console.log('   - Check file size limits');
          break;
        case 'PDF Parsing Simulation':
          console.log('   - pdf-parse library may be missing or misconfigured');
          console.log('   - Check PDF file format compatibility');
          break;
      }
    });

    // Clean up test file
    if (fs.existsSync('debug-test.pdf')) {
      fs.unlinkSync('debug-test.pdf');
      console.log('\n🧹 Cleaned up test files');
    }
  }
}

// Run the debugger
async function main() {
  const pdfDebugger = new PDFUploadDebugger();
  await pdfDebugger.debugPDFUpload();
}

main().catch(console.error); 