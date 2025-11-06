import { PDFDocument, PDFRadioGroup } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function extractRadioOptions() {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'SSF-vigente-marzo-2025.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('\n📻 RADIO BUTTON GROUPS AND THEIR OPTIONS:\n');
    console.log('═'.repeat(80));
    
    fields.forEach((field) => {
      if (field instanceof PDFRadioGroup) {
        const name = field.getName();
        const options = field.getOptions();
        
        console.log(`\n🔘 ${name}`);
        console.log('─'.repeat(80));
        console.log('Available options:');
        options.forEach((option, index) => {
          console.log(`  ${index + 1}. "${option}"`);
        });
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

extractRadioOptions();
