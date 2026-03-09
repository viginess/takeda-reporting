import PDFDocument from 'pdfkit';
import { patientReports } from '../../db/schema.js';


type PatientReport = typeof patientReports.$inferSelect;

/**
 * Generates a branded Takeda PDF report for a safety case.
 * Maps data to E2B R3 field labels for consistency.
 */
export async function generateSafetyPDF(report: PatientReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      info: {
        Title: `Safety Report - ${report.referenceId || report.id}`,
        Author: 'Takeda Safety Reporting System',
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // --- Branding Essentials ---
    const clinSolutionBlue = '#1E3A8A';
    const slateGray = '#64748B';

    // Header Branding
    doc.rect(0, 0, 600, 40).fill(clinSolutionBlue);
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('CLINSOLUTION SAFETY REPORTING', 50, 12);
    
    doc.moveDown(3);

    // Title & Report ID
    doc.fillColor(clinSolutionBlue).fontSize(22).text('Individual Case Safety Report (ICSR)', 50, 70);
    doc.fontSize(10).fillColor(slateGray).text(`Internal Report ID: ${report.id}`, 50, 95);
    doc.moveDown();

    // Horizontal Line
    doc.strokeColor(clinSolutionBlue).lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();
    doc.moveDown(2);

    // Section 1: Regulatory Metadata (N)
    drawSectionHeader(doc, 'SECTION 1: REGULATORY METADATA', clinSolutionBlue);
    
    doc.fillColor('black').font('Helvetica').fontSize(10);
    const metaY = 145;
    doc.font('Helvetica-Bold').text('E2B Code', 50, metaY);
    doc.text('Field Description', 130, metaY);
    doc.text('Value', 350, metaY);
    
    doc.font('Helvetica');
    doc.text('N.2.r.1', 50, metaY + 20);
    doc.text('Message Identifier', 130, metaY + 20);
    doc.font('Helvetica-Bold').text(report.referenceId || 'PENDING', 350, metaY + 20);

    doc.font('Helvetica');
    doc.text('N.2.r.4', 50, metaY + 40);
    doc.text('Date of Creation', 130, metaY + 40);
    doc.text(report.createdAt ? report.createdAt.toISOString() : 'N/A', 350, metaY + 40);

    doc.moveDown(4);

    // Section 2: Patient Information (D)
    drawSectionHeader(doc, 'SECTION 2: PATIENT CHARACTERISTICS', clinSolutionBlue);
    
    const pDetails = (report.patientDetails as any) || {};
    const patientY = 225;
    
    renderGridRow(doc, 'D.1', 'Patient Initials', pDetails.initials || 'N/A', patientY);
    renderGridRow(doc, 'D.2.1', 'Date of Birth', pDetails.dob || 'N/A', patientY + 20);
    renderGridRow(doc, 'D.5', 'Gender', pDetails.gender || 'Unknown', patientY + 40);

    doc.moveDown(4);

    // Section 3: Adverse Events / Reactions (E)
    drawSectionHeader(doc, 'SECTION 3: ADVERSE REACTIONS', clinSolutionBlue);
    
    const reactionsY = 320;
    const symptoms = (report.symptoms as any[]) || [];
    
    doc.font('Helvetica-Bold').text('E2B Code', 50, reactionsY);
    doc.text('Term (MedDRA LLT)', 130, reactionsY);
    doc.text('Code', 350, reactionsY);
    
    doc.font('Helvetica');
    symptoms.forEach((s, idx) => {
      const y = reactionsY + 20 + (idx * 20);
      doc.text(`E.i.2.1b.${idx+1}`, 50, y);
      doc.text(s.term || s.name || 'Unknown', 130, y);
      doc.font('Helvetica-Bold').text(s.meddraCode || '00000000', 350, y);
    });

    doc.moveDown(4);

    // Section 4: Drug / Product Information (G)
    drawSectionHeader(doc, 'SECTION 4: SUSPECT DRUG INFORMATION', clinSolutionBlue);
    
    const drugY = reactionsY + 40 + (symptoms.length * 20); // Dynamic offset
    const products = (report.products as any[]) || [];
    
    doc.font('Helvetica-Bold').text('E2B Code', 50, drugY);
    doc.text('Product Name', 130, drugY);
    doc.text('Indication (MedDRA)', 350, drugY);
    
    doc.font('Helvetica');
    products.forEach((p, idx) => {
      const y = drugY + 20 + (idx * 20);
      doc.text(`G.k.2.2.${idx+1}`, 50, y);
      doc.text(p.name || 'Unknown Product', 130, y);
      doc.text(p.condition || 'Not Stated', 350, y);
    });

    // --- Footer ---
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#94A3B8');
      doc.text(
        `Confidential - Clin Solution L.L.C. Information | Page ${i + 1} of ${pageCount}`,
        50,
        780,
        { align: 'center' }
      );
    }

    doc.end();
  });
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, color: string) {
  const currentY = doc.y;
  doc.rect(50, currentY, 500, 18).fill(color + '15'); // Very light red background
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(title, 55, currentY + 4);
  doc.moveDown(1);
}

function renderGridRow(doc: PDFKit.PDFDocument, code: string, desc: string, value: string, y: number) {
  doc.fillColor('black').font('Helvetica').fontSize(10);
  doc.text(code, 50, y);
  doc.text(desc, 130, y);
  doc.font('Helvetica-Bold').text(value, 350, y);
}
