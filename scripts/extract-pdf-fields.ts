import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function extractPdfFields() {
  try {
    // Read the PDF template
    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'SSF-vigente-marzo-2025.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the form
    const form = pdfDoc.getForm();
    
    // Get all fields
    const fields = form.getFields();
    
    console.log(`\n📄 Total fields found: ${fields.length}\n`);
    console.log('═'.repeat(80));
    
    // Extract field information
    const fieldData = fields.map((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;
      
      return {
        index: index + 1,
        name,
        type
      };
    });
    
    // Group by type
    const fieldsByType: Record<string, any[]> = {};
    fieldData.forEach(field => {
      if (!fieldsByType[field.type]) {
        fieldsByType[field.type] = [];
      }
      fieldsByType[field.type].push(field);
    });
    
    // Display grouped fields
    Object.keys(fieldsByType).sort().forEach(type => {
      console.log(`\n📋 ${type} (${fieldsByType[type].length} fields):`);
      console.log('─'.repeat(80));
      fieldsByType[type].forEach(field => {
        console.log(`  ${field.index}. ${field.name}`);
      });
    });
    
    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'scripts', 'pdf-fields.json');
    fs.writeFileSync(outputPath, JSON.stringify(fieldData, null, 2));
    
    console.log('\n' + '═'.repeat(80));
    console.log(`\n✅ Field data saved to: ${outputPath}\n`);
    
  } catch (error) {
    console.error('❌ Error extracting PDF fields:', error);
    process.exit(1);
  }
}

extractPdfFields();
