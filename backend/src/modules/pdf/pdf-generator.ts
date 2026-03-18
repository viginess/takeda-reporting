import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { translateToEnglish } from '../../utils/azure-translator.js';

// --- Global Font Resolution Strategy ---
// Since fonts have been bundled into the project, we strictly load from assets.
const resolveFontPath = (fileName: string): string => {
    return path.join(process.cwd(), 'assets', 'fonts', fileName);
};

const FONT_REGISTRY: Record<string, string> = {
    'JA': resolveFontPath('msgothic.ttc'),
    'TA': resolveFontPath('Nirmala.ttc'),
    'HI': resolveFontPath('Nirmala.ttc'),
    'AR': resolveFontPath('Amiri-Regular.ttf'),
    'HE': resolveFontPath('Alef-Regular.ttf'),
};

const DEFAULT_FONT = 'Helvetica';

/**
 * Generates a branded clin solutions L.L.C PDF report for a safety case.
 * Maps data to E2B R3 field labels for consistency.
 */
export async function generateSafetyPDF(report: any): Promise<Buffer> {
    const subLang = (report.submissionLanguage || 'en').toUpperCase();
    
    // 1. Pre-process Translations (Async)
    let englishNarrative = report.additionalDetails || 'No narrative provided.';
    if (subLang !== 'EN' && report.additionalDetails) {
        console.log(`[PDF] Translating narrative from ${subLang} to EN...`);
        try {
            const translation = await translateToEnglish(report.additionalDetails);
            console.log(`[PDF] Translation successful: ${translation.detectedLanguage} -> EN`);
            englishNarrative = translation.translatedText;
        } catch (e) {
            console.warn('[PDF] Auto-translation failed, using original text as fallback', e);
        }
    }

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

    // Dynamic International Font Registration
    let nativeFontName = '';
    const fontPath = FONT_REGISTRY[subLang];

    if (fontPath && fs.existsSync(fontPath)) {
        try {
            // Note: Nirmala/MS-Gothic might be collections (.ttc), handle suffix if needed
            const fontName = fontPath.endsWith('.ttc') ? (subLang === 'JA' ? 'MS-Gothic' : 'NirmalaUI') : undefined;
            doc.registerFont('NativeFont', fontPath, fontName);
            nativeFontName = 'NativeFont';
        } catch (e) {
            console.warn(`Font registration failed for ${subLang}, falling back to standard fonts`);
        }
    }

    // --- Branding Essentials ---
    const clinRed = '#CE0037';
    const slateGray = '#64748B';

    // Header Branding
    doc.rect(0, 0, 600, 50).fill(clinRed);
    
    try {
      doc.image('d:\\takeda-reporting\\frontend\\src\\assets\\logo.jpg', 500, 5, { width: 80 });
    } catch (e) {
      console.error('Logo not found, skipping image rendering');
    }

    doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('CLINSOLUTION SAFETY REPORTING', 50, 15);
    
    doc.moveDown(3);

    // Section 1: Regulatory Metadata (N/C)
    const severity = (report.severity || '').toLowerCase();

    // --- Title & Metadata Section ---
    let titleY = 85;
    
    // 1. Expedited Flag - Moved to Left side to avoid Logo collision
    if (severity === 'fatal' || severity === 'death' || severity === 'life-threatening') {
        doc.rect(50, 60, 175, 18).fillColor(clinRed).fill();
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text('CRITICAL: EXPEDITED REPORT', 55, 65);
        titleY = 85; // Bring title closer even if banner exists
    }

    // 2. Report Title
    doc.fillColor(clinRed).fontSize(22).font('Helvetica-Bold').text('Individual Case Safety Report (ICSR)', 50, titleY);
    
    // 3. Internal ID
    const idY = titleY + 30;
    doc.fontSize(10).fillColor(slateGray).font('Helvetica').text(`Internal Report ID: ${report.id}`, 50, idY);
    
    // 4. Hero Divider
    const dividerY = idY + 15;
    doc.strokeColor(clinRed).lineWidth(1.5).moveTo(50, dividerY).lineTo(550, dividerY).stroke();

    // 5. Initial Content Anchor
    doc.y = dividerY + 15; // Tighter buffer before Section 1

    // Section 1: Regulatory Metadata (N/C)
    drawSectionHeader(doc, 'SECTION 1 (N/C): REGULATORY METADATA', clinRed);
    
    // Calculate full Message ID matching E2B XML
    const prefix = (report as any).countryCode || 'US';
    const now = report.createdAt ? new Date(report.createdAt) : new Date();
    const timestampTS = now.toISOString().replace(/[-:T]/g, '').split('.')[0];
    const fullMessageId = `${prefix}-CLINSOLUTION-${timestampTS}-${(report.referenceId || report.id.substring(0, 8)).toUpperCase()}`;

    renderGridHeader(doc, ['E2B Code', 'Field Description', 'Value']);
    renderGridRow(doc, 'N.2.r.1', 'Message Identifier', fullMessageId, true);
    renderGridRow(doc, 'N.2.r.4', 'Date of Creation', timestampTS + '+0000', true);
    
    // C.1.11.1: Amendment/Nullification
    if (report.reportVersion > 1) {
      renderGridRow(doc, 'C.1.11.1', 'Report Amendment/Nullification', 'Amendment (1)', true);
    }
    
    const recentDate = report.lastUpdatedAt || report.updatedAt || report.createdAt;
    renderGridRow(doc, 'C.1.5', 'Date of Most Recent Info', recentDate ? new Date(recentDate).toISOString().split('T')[0] : 'N/A', true);

    let reportTypeCode = 'Other (3)';
    const rType = (report.reporterType || '').toUpperCase();
    if (rType === 'HCP' || rType === 'PATIENT' || rType === 'SPONTANEOUS') reportTypeCode = 'Spontaneous (1)';
    renderGridRow(doc, 'C.1.3', 'Type of Report', reportTypeCode, true);
    renderGridRow(doc, 'C.3.1', 'Sender Type', 'Pharmaceutical Company (1)', true);

    doc.moveDown(2);

    // Section 1.5: Reporter Information (C)
    // Extract reporter detail based on report table structure
    let reporter = report.reporterDetails || report.hcpDetails || {};
    
    // Fallback to patientDetails if HCP is empty (common in patient reports)
    const isReporterEmpty = !reporter.firstName && !reporter.lastName && !reporter.name && !reporter.email && !reporter.phone;
    if (isReporterEmpty && report.patientDetails) {
      reporter = report.patientDetails;
    }

    drawSectionHeader(doc, 'SECTION 1.5 (C): PRIMARY REPORTER DETAILS', clinRed);
    const reporterName = [reporter.firstName || reporter.name || reporter.initials, reporter.lastName].filter(Boolean).join(' ');
    renderGridRow(doc, 'C.2.r.1', 'Reporter Name', reporterName || 'N/A', true);
    if (reporter.relationship) {
        renderGridRow(doc, 'C.2.r', 'Relationship to Patient', reporter.relationship, true);
    }
    renderGridRow(doc, 'C.2.r.2', 'Institution', reporter.institution || 'N/A', true);
    renderGridRow(doc, 'C.2.r.3', 'Country', reporter.country || (report as any).countryCode || 'N/A', true);

    doc.moveDown(2);

    // Section 2: Patient Information (D)
    drawSectionHeader(doc, 'SECTION 2 (D): PATIENT CHARACTERISTICS', clinRed);
    
    const pDetails = (report.patientDetails as any) || {};
    renderGridRow(doc, 'D.1', 'Patient Initials', pDetails.initials || 'N/A', true);
    // D.2.1: Format DOB to YYYY-MM-DD
    const formattedDob = pDetails.dob ? new Date(pDetails.dob).toISOString().split('T')[0] : 'N/A';
    renderGridRow(doc, 'D.2.1', 'Date of Birth', formattedDob, true);
    if (pDetails.ageValue) {
        renderGridRow(doc, 'D.2.2a', 'Age at Onset', pDetails.ageValue.toString(), true);
    }
    renderGridRow(doc, 'D.3', 'Weight (kg)', pDetails.weight || 'N/A', true);
    renderGridRow(doc, 'D.4', 'Height (cm)', pDetails.height || 'N/A', true);
    renderGridRow(doc, 'D.5', 'Gender', pDetails.gender || 'Unknown', true);

    doc.moveDown(2);

    // Section 3: Adverse Events / Reactions (E)
    drawSectionHeader(doc, 'SECTION 3 (E): ADVERSE REACTIONS', clinRed);
    
    renderGridHeader(doc, ['E2B Code', 'Term (MedDRA LLT)', 'Code']);
    
    const symptoms = (report.symptoms as any[]) || [];
    symptoms.forEach((s, idx) => {
      renderGridRow(doc, `E.i.2.1b.${idx+1}`, s.lltName || s.name || 'Unknown', s.lltCode || s.meddraCode || '00000000', true);
      
      if (s.treatment || s.symptomTreated === 'yes') {
          renderGridRow(doc, `E.i.8`, 'Treatment Applied', s.treatment || 'Yes');
      }
      
      // E.i.3.2: Event-level Seriousness
      const rawSer = s.seriousness;
      const sSevString = Array.isArray(rawSer) ? rawSer.join(', ') : (rawSer || '');
      const sSev = sSevString.toLowerCase();
      
      let sSer = 'Non-Serious';
      if (sSev && sSev !== 'info' && sSev !== 'low') {
        sSer = 'Serious';
        if (sSev.includes('death')) sSer += ' (Fatal)';
        else if (sSev.includes('life')) sSer += ' (Life-threatening)';
        else if (sSev.includes('hosp')) sSer += ' (Hospitalization)';
      }
      renderGridRow(doc, `E.i.3.2`, 'Seriousness (Event)', sSer);
      
      // E.i.9: Country of Occurrence
      renderGridRow(doc, `E.i.9`, 'Occurrence Country', s.occurrenceCountry || (report as any).countryCode || 'US');
      doc.moveDown(0.5);
    });
    let seriousness = 'Non-Serious';
    if (severity !== 'info' && severity !== 'low' && severity !== '') {
        seriousness = 'Serious';
        if (severity === 'fatal' || severity === 'death') seriousness += ' (Results in Death)';
        else if (severity === 'life-threatening') seriousness += ' (Life-threatening)';
        else if (severity === 'hospitalization') seriousness += ' (Hospitalization)';
        else if (severity === 'disabling') seriousness += ' (Disabling)';
        else seriousness += ' (Other Medically Important Condition)';
    }
    renderGridRow(doc, 'E.i.3.1', 'Seriousness Criteria', seriousness, true);

    doc.moveDown(2);

    // Section 4: Drug / Product Information (G)
    drawSectionHeader(doc, 'SECTION 4 (G): SUSPECT DRUG INFORMATION', clinRed);
    
    renderGridHeader(doc, ['E2B Code', 'Product Name', 'Indication (MedDRA)']);
    
    const products = (report.products as any[]) || [];
    products.forEach((p, idx) => {
      const indication = p.conditions?.[0]?.name || p.condition || 'Not Stated';
      renderGridRow(doc, `G.k.2.2.${idx+1}`, p.productName || p.name || 'Unknown Product', indication);
      
      // Additional properties
      if (p.actionTaken) {
          renderGridRow(doc, 'G.k.8', 'Action Taken', p.actionTaken, true);
      }
      
      // IDMP Identifiers
      if (p.mpid) renderGridRow(doc, 'G.k.2.1.1', 'MPID', p.mpid);
      if (p.phpid) renderGridRow(doc, 'G.k.2.1.2', 'PhPID', p.phpid);
    });
    
    // Section 4.2: Causality Matrix (G.k.9.i)
    if (products.some(p => p.causality)) {
        drawSectionHeader(doc, 'SECTION 4.2: CAUSALITY ASSESSMENT', clinRed);
        renderGridHeader(doc, ['Drug', 'Reaction', 'Causality']);
        products.forEach(p => {
          if (p.causality) {
            p.causality.forEach((c: any) => {
              renderGridRow(doc, 'G.k.9.i', p.productName || 'Drug', `${c.reactionName || 'Reaction'}: ${c.method || ''} - ${c.result || 'Related'}`, true);
            });
          }
        });
    }

    doc.moveDown(2);

    // Section 4.5: Other Medications (G.k.2.3.r)
    const otherMeds = (report.otherMedications as any[]) || [];
    if (otherMeds.length > 0) {
        drawSectionHeader(doc, 'SECTION 4.5: CONCOMITANT MEDICATIONS', clinRed);
        renderGridHeader(doc, ['E2B Code', 'Product Name', 'Indication / Reason']);
        otherMeds.forEach((p, idx) => {
           renderGridRow(doc, `G.k.2.3.r.${idx+1}`, p.product || p.productName || 'Unknown', p.condition || p.reason || 'N/A', true);
        });
        doc.moveDown(2);
    }

    // Section 5: Medical History & Lab Tests (D/F)
    if (report.hasRelevantHistory === 'yes' || report.labTestsPerformed === 'yes') {
        drawSectionHeader(doc, 'SECTION 5 (D/F): RELEVANT HISTORY & LAB TESTS', clinRed);
        
        if (report.hasRelevantHistory === 'yes') {
            doc.fillColor(clinRed).font('Helvetica-Bold').fontSize(10).text('Medical History (D.7.1.r)', 50);
            doc.fillColor('black').font('Helvetica').fontSize(10).text(typeof report.medicalHistory === 'string' ? report.medicalHistory : JSON.stringify(report.medicalHistory), 50);
            doc.moveDown();
        }

        if (report.labTestsPerformed === 'yes') {
            doc.fillColor(clinRed).font('Helvetica-Bold').fontSize(10).text('Lab Tests & Procedures (F.r)', 50);
            const labs = Array.isArray(report.labTests) ? report.labTests : [];
            labs.forEach((lab: any, idx: number) => {
                const testName = lab.testName || lab.name || 'Unknown Test';
                const meddra = lab.meddraCode ? ` [MedDRA: ${lab.meddraCode}]` : '';
                const unit = lab.unit || lab.resultUnit || '';
                const result = lab.testValue || lab.result || lab.resultValue || 'No Result';
                const qualifier = lab.testQualifier ? `${lab.testQualifier} ` : '';
                doc.fillColor('black').font('Helvetica').fontSize(10).text(`${idx + 1}. ${testName}${meddra}: ${qualifier}${result} ${unit} (${lab.date || 'No Date'})`, 60);
                if (lab.testComments) {
                    doc.fillColor(slateGray).fontSize(9).text(`   Comments: ${lab.testComments}`, 60);
                }
            });
            doc.moveDown();
        }
    }

    // Section 6: Narrative & Sender Comments (H)
    drawSectionHeader(doc, 'SECTION 6 (H): CASE NARRATIVE & SENDER COMMENTS', clinRed);
    
    // H.1: Case Narrative (Global English version)
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Case Narrative (H.1) - [English Translation]', 50);
    doc.font(DEFAULT_FONT).fontSize(10).text(englishNarrative, 50, undefined, { align: 'justify', width: 500 });
    doc.moveDown();

    // H.5.r: Native Language Narrative (Preserved original)
    if (subLang !== 'EN') {
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text(`Native Narrative (H.5.r) - [Original ${subLang}]`, 50);
        if (nativeFontName) doc.font(nativeFontName);
        else doc.font(DEFAULT_FONT);
        
        doc.fontSize(10).text(report.additionalDetails || 'N/A', 50, undefined, { align: 'justify', width: 500 });
        doc.moveDown();
    }

    if (report.senderDiagnosis || report.h3) {
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text("Sender's Diagnosis (H.3)", 50);
        doc.font('Helvetica').fontSize(10).text(report.senderDiagnosis || report.h3, 50);
        doc.moveDown();
    }

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
        `Confidential - Clin Solutions Safety Reporting System | Page ${i + 1} of ${pageCount}`,
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

  // Professional style: Bottom border below the text
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(title, 50);
  doc.strokeColor(color).lineWidth(0.5).moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
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

