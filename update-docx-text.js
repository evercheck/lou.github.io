import fs from 'fs';
import mammoth from 'mammoth';
import { Packer, Document, Paragraph } from 'docx';

async function extractTextFromDocx(filePath) {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
}

async function main() {
    const sourcePath = 'ngoc.vo.docx';
    const targetPath = 'khoa.hoang.docx';
    const outputPath = 'khoa.hoang.updated.docx';

    // Extract all text from source
    const text = await extractTextFromDocx(sourcePath);

    // Split text into paragraphs
    const paragraphs = text.split(/\r?\n/).filter(Boolean).map(line => new Paragraph(line));

    // Create a new document with the extracted text
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: paragraphs,
            },
        ],
    });

    // Write the new document to outputPath
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Updated DOCX written to ${outputPath}`);
}

main().catch(err => {
    console.error('Error:', err);
}); 