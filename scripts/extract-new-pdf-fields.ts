import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function extractPdfFields() {
    try {
        // Read the PDF template
        const pdfPath = path.join(process.cwd(), 'public', 'forms', 'Autorización Well.pdf');
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
            // @ts-ignore
            if (!fieldsByType[field.type]) {
                // @ts-ignore
                fieldsByType[field.type] = [];
            }
            // @ts-ignore
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

    } catch (error) {
        console.error('❌ Error extracting PDF fields:', error);
        process.exit(1);
    }
}

extractPdfFields();
