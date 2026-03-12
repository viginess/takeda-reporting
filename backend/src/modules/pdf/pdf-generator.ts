import PDFDocument from 'pdfkit';

/**
 * Generates a branded clin solutions L.L.C PDF report for a safety case.
 * Maps data to E2B R3 field labels for consistency.
 */
export async function generateSafetyPDF(report: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Safety Report - ${report.referenceId || report.id}`,
        Author: 'Clin Solutions L.L.C',
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // --- Branding Essentials ---
    const takedaRed = '#CE0037';
    const slateGray = '#64748B';

    // Header Branding
    doc.rect(0, 0, 600, 50).fill(takedaRed);
    
    try {
      doc.image('d:\\takeda-reporting\\frontend\\src\\assets\\logo.jpg', 500, 5, { width: 80 });
    } catch (e) {
      console.error('Logo not found, skipping image rendering');
    }

    doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('TAKEDA SAFETY REPORTING', 50, 15);
    
    doc.moveDown(3);

    // Title & Report ID
    doc.fillColor(takedaRed).fontSize(22).text('Individual Case Safety Report (ICSR)', 50, 80);
    doc.fontSize(10).fillColor(slateGray).text(`Internal Report ID: ${report.id}`, 50, 105);
    doc.moveDown(0.5);

    // Horizontal Line
    doc.strokeColor(takedaRed).lineWidth(1).moveTo(50, 125).lineTo(550, 125).stroke();
    doc.moveDown(2);

    // Section 1: Regulatory Metadata (N)
    drawSectionHeader(doc, 'SECTION 1: REGULATORY METADATA', takedaRed);
    
    renderGridHeader(doc, ['E2B Code', 'Field Description', 'Value']);
    renderGridRow(doc, 'N.2.r.1', 'Message Identifier', report.referenceId || 'PENDING', true);
    renderGridRow(doc, 'N.2.r.4', 'Date of Creation', report.createdAt instanceof Date ? report.createdAt.toISOString() : 'N/A', true);

    doc.moveDown(2);

    // Section 1.5: Reporter Information (C)
    // Extract reporter detail based on report table structure
    const reporter = report.reporterDetails || report.hcpDetails || report.patientDetails || {};
    drawSectionHeader(doc, 'SECTION 1.5: PRIMARY REPORTER DETAILS', takedaRed);
    const reporterName = [reporter.firstName || reporter.name, reporter.lastName].filter(Boolean).join(' ');
    renderGridRow(doc, 'C.2.r.1', 'Reporter Name', reporterName || 'N/A', true);
    renderGridRow(doc, 'C.2.r.2', 'Institution', reporter.institution || 'N/A', true);
    renderGridRow(doc, 'C.2.r.3', 'Country', reporter.country || 'N/A', true);

    doc.moveDown(2);

    // Section 2: Patient Information (D)
    drawSectionHeader(doc, 'SECTION 2: PATIENT CHARACTERISTICS', takedaRed);
    
    const pDetails = (report.patientDetails as any) || {};
    renderGridRow(doc, 'D.1', 'Patient Initials', pDetails.initials || 'N/A', true);
    renderGridRow(doc, 'D.2.1', 'Date of Birth', pDetails.dob || 'N/A', true);
    renderGridRow(doc, 'D.3', 'Weight (kg)', pDetails.weight || 'N/A', true);
    renderGridRow(doc, 'D.4', 'Height (cm)', pDetails.height || 'N/A', true);
    renderGridRow(doc, 'D.5', 'Gender', pDetails.gender || 'Unknown', true);

    doc.moveDown(2);

    // Section 3: Adverse Events / Reactions (E)
    drawSectionHeader(doc, 'SECTION 3: ADVERSE REACTIONS', takedaRed);
    
    renderGridHeader(doc, ['E2B Code', 'Term (MedDRA LLT)', 'Code']);
    
    const symptoms = (report.symptoms as any[]) || [];
    symptoms.forEach((s, idx) => {
      renderGridRow(doc, `E.i.2.1b.${idx+1}`, s.term || s.name || 'Unknown', s.meddraCode || '00000000', true);
    });

    doc.moveDown(2);

    // Section 4: Drug / Product Information (G)
    drawSectionHeader(doc, 'SECTION 4: SUSPECT DRUG INFORMATION', takedaRed);
    
    renderGridHeader(doc, ['E2B Code', 'Product Name', 'Indication (MedDRA)']);
    
    const products = (report.products as any[]) || [];
    products.forEach((p, idx) => {
      renderGridRow(doc, `G.k.2.2.${idx+1}`, p.name || 'Unknown Product', p.condition || 'Not Stated');
    });

    doc.moveDown(2);

    // Section 4.5: Other Medications (G.k.2.3.r)
    const otherMeds = (report.otherMedications as any[]) || [];
    if (otherMeds.length > 0) {
        drawSectionHeader(doc, 'SECTION 4.5: CONCOMITANT MEDICATIONS', takedaRed);
        renderGridHeader(doc, ['E2B Code', 'Product Name', 'Indication / Reason']);
        otherMeds.forEach((p, idx) => {
           renderGridRow(doc, `G.k.2.3.r.${idx+1}`, p.productName || 'Unknown', p.reason || 'N/A', true);
        });
        doc.moveDown(2);
    }

    // Section 5: Medical History & Lab Tests
    if (report.hasRelevantHistory === 'yes' || report.labTestsPerformed === 'yes') {
        drawSectionHeader(doc, 'SECTION 5: RELEVANT HISTORY & LAB TESTS', takedaRed);
        
        if (report.hasRelevantHistory === 'yes') {
            doc.fillColor(takedaRed).font('Helvetica-Bold').fontSize(10).text('Medical History (D.7.1.r)', 50);
            doc.fillColor('black').font('Helvetica').fontSize(10).text(typeof report.medicalHistory === 'string' ? report.medicalHistory : JSON.stringify(report.medicalHistory), 50);
            doc.moveDown();
        }

        if (report.labTestsPerformed === 'yes') {
            doc.fillColor(takedaRed).font('Helvetica-Bold').fontSize(10).text('Lab Tests & Procedures (F.r)', 50);
            const labs = Array.isArray(report.labTests) ? report.labTests : [];
            labs.forEach((lab: any, idx: number) => {
                doc.fillColor('black').font('Helvetica').fontSize(10).text(`${idx + 1}. ${lab.testName || 'Unknown Test'}: ${lab.result || 'No Result'} ${lab.unit || ''} (${lab.date || 'No Date'})`, 60);
            });
            doc.moveDown();
        }
    }

    // Section 6: Narrative & Sender Comments
    drawSectionHeader(doc, 'SECTION 6: CASE NARRATIVE & SENDER COMMENTS', takedaRed);
    
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Case Narrative (H.1)', 50);
    doc.font('Helvetica').fontSize(10).text(report.additionalDetails || 'No narrative provided.', 50, undefined, { align: 'justify', width: 500 });
    doc.moveDown();

    if (report.adminNotes) {
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text("Sender's Comments (H.4)", 50);
        doc.font('Helvetica').fontSize(10).text(report.adminNotes, 50, undefined, { align: 'justify', width: 500 });
        doc.moveDown();
    }

    // --- Footer ---
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#94A3B8');
      doc.text(
        `Confidential - Takeda Safety Reporting System | Page ${i + 1} of ${pageCount}`,
        50,
        780,
        { align: 'center' }
      );
    }

    doc.end();
  });
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, color: string) {
  // Ensure we have enough space for the header, otherwise start a new page
  if (doc.y > 700) doc.addPage();

  const currentY = doc.y;
  // Professional style: Subtle bottom border instead of tinted background
  doc.strokeColor(color).lineWidth(0.5).moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke();
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(title, 50, currentY);
  doc.moveDown(1.2);
}

function renderGridHeader(doc: PDFKit.PDFDocument, headers: string[]) {
    doc.fillColor('#CE0037').font('Helvetica-Bold').fontSize(10);
    const currentY = doc.y;
    doc.text(headers[0], 50, currentY);
    doc.text(headers[1], 130, currentY);
    if (headers[2]) doc.text(headers[2], 350, currentY);
    doc.moveDown(0.5);
}

function renderGridRow(doc: PDFKit.PDFDocument, code: string, desc: string, value: string, boldValue: boolean = false) {
  // Ensure we don't start a row with only 1 line left on page
  if (doc.y > 750) doc.addPage();
    
  const currentY = doc.y;
  doc.fillColor('black').font('Helvetica').fontSize(10);
  doc.text(code, 50, currentY);
  doc.text(desc, 130, currentY);
  
  if (boldValue) doc.font('Helvetica-Bold');
  doc.text(value, 350, currentY, { width: 200 });
  doc.font('Helvetica');
  
  doc.moveDown(0.5);
}

