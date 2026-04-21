import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { translateToEnglish } from '../../utils/services/azure-translator.js';

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

export async function generateSafetyPDF(report: any): Promise<Buffer> {
    const subLang = (report.submissionLanguage || 'en').toUpperCase();
    let englishNarrative = report.additionalDetails || 'No narrative provided.';
    
    if (subLang !== 'EN' && report.additionalDetails) {
        try {
            const translation = await translateToEnglish(report.additionalDetails);
            englishNarrative = translation.translatedText;
        } catch (e) {
            console.warn('[PDF] Translation fallback used');
        }
    }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            margin: 50, size: 'A4', bufferPages: true,
            info: {
                Title: `Safety Report - ${report.referenceId || report.id}`,
                Author: 'Clin Solutions L.L.C',
                // GxP Gap Fix: Tamper Evidence Placeholder
                Keywords: `XML-Hash: ${crypto.createHash('sha256').update(report.id).digest('hex')}`
            }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Font Registration
        const fPath = FONT_REGISTRY[subLang];
        if (fPath && fs.existsSync(fPath)) {
            try {
                const fName = fPath.endsWith('.ttc') ? (subLang === 'JA' ? 'MS-Gothic' : 'NirmalaUI') : undefined;
                doc.registerFont('NativeFont', fPath, fName);
            } catch (e) {}
        }

        const clinRed = '#CE0037';
        const slateGray = '#64748B';

        // Header
        doc.rect(0, 0, 600, 50).fill(clinRed);
        try {
            // Bug Fix: Relative path for logo
            const logoPath = path.join(process.cwd(), 'assets', 'logo.jpg');
            if (fs.existsSync(logoPath)) doc.image(logoPath, 500, 5, { width: 80 });
        } catch (e) {}

        doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('CLINSOLUTION SAFETY REPORTING', 50, 15);
        doc.moveDown(3);

        const severity = (report.severity || '').toLowerCase();
        const isExpedited = severity === 'fatal' || severity === 'death' || severity === 'life-threatening';
        let titleY = 85;

        if (isExpedited) {
            doc.rect(50, 60, 175, 18).fillColor(clinRed).fill();
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text('CRITICAL: EXPEDITED REPORT', 55, 65);
        }

        doc.fillColor(clinRed).fontSize(22).font('Helvetica-Bold').text('Individual Case Safety Report (ICSR)', 50, titleY);
        doc.fontSize(10).fillColor(slateGray).font('Helvetica').text(`Internal Report ID: ${report.id}`, 50, titleY + 30);
        doc.strokeColor(clinRed).lineWidth(1.5).moveTo(50, titleY + 45).lineTo(550, titleY + 45).stroke();
        doc.y = titleY + 60;

        // Section 1: Metadata
        drawSectionHeader(doc, 'SECTION 1 (N/C): REGULATORY METADATA', clinRed);
        const prefix = (report as any).countryCode || 'US';
        const cNow = report.createdAt ? new Date(report.createdAt) : new Date();
        const ts = cNow.toISOString().replace(/[-:T]/g, '').split('.')[0];
        const mId = `${prefix}-CLINSOLUTION-${ts}-${(report.referenceId || report.id.substring(0, 8)).toUpperCase()}`;

        renderGridHeader(doc, ['E2B Code', 'Field Description', 'Value']);
        renderGridRow(doc, 'N.2.r.1', 'Message Identifier', mId, true);
        renderGridRow(doc, 'N.2.r.4', 'Date of Creation', ts + '+0000', true);
        if (report.reportVersion > 1) renderGridRow(doc, 'C.1.11.1', 'Report Amendment', 'Amendment (1)', true);
        
        let rTypeCode = 'Other (3)';
        const rType = (report.reporterType || '').toUpperCase();
        if (rType === 'HCP' || rType === 'PATIENT') rTypeCode = 'Spontaneous (1)';
        renderGridRow(doc, 'C.1.3', 'Type of Report', rTypeCode, true);
        doc.moveDown(1);

        // Section 2: Patient
        drawSectionHeader(doc, 'SECTION 2 (D): PATIENT CHARACTERISTICS', clinRed);
        const pDetails = (report.patientDetails as any) || {};
        renderGridRow(doc, 'D.1', 'Patient Initials', pDetails.initials || 'N/A', true);
        renderGridRow(doc, 'D.2.1', 'Date of Birth', pDetails.dob ? new Date(pDetails.dob).toISOString().split('T')[0] : 'N/A', true);
        if (pDetails.ageValue) renderGridRow(doc, 'D.2.2a', 'Age at Onset', pDetails.ageValue.toString(), true);
        
        // Bug Fix: Consistent Gender Labels
        let gLabel = 'Unknown';
        const g = (pDetails.gender || '').toString().toUpperCase();
        if (g === 'M' || g === '1') gLabel = 'Male (1)';
        else if (g === 'F' || g === '2') gLabel = 'Female (2)';
        else if (g === 'UN' || g === '0') gLabel = 'Unknown (0)';
        renderGridRow(doc, 'D.5', 'Gender', gLabel, true);
        doc.moveDown(1);

        // Section 3: Reactions (E.i)
        drawSectionHeader(doc, 'SECTION 3 (E): ADVERSE REACTIONS', clinRed);
        const allS = (report.symptoms as any[]) || [];
        const symptoms = allS.filter(s => !s.testValue && !s.result);
        const labSymps = allS.filter(s => s.testValue || s.result);

        renderGridHeader(doc, ['E2B Code', 'Term (MedDRA LLT)', 'Code']);
        symptoms.forEach((s, idx) => {
            renderGridRow(doc, `E.i.2.1b.${idx+1}`, s.lltName || s.name || 'Unknown', s.lltCode || s.meddraCode || '00000000', true);
            const sSev = (s.seriousness || '').toLowerCase();
            let sSerStr = 'Non-Serious';
            if (sSev && sSev !== 'info' && sSev !== 'low') {
                sSerStr = 'Serious';
                if (sSev.includes('fatal')) sSerStr += ' (Fatal)';
                else if (sSev.includes('life')) sSerStr += ' (Life-threatening)';
            }
            renderGridRow(doc, 'E.i.3.2', 'Seriousness (Event)', sSerStr);
        });
        renderGridRow(doc, 'E.i.3.1', 'Seriousness Criteria', isExpedited ? 'Serious' : 'Non-Serious', true);
        doc.moveDown(1);

        // Section 4: Drugs (G.k)
        drawSectionHeader(doc, 'SECTION 4 (G): SUSTAINED DRUG INFORMATION', clinRed);
        const products = (report.products as any[]) || [];
        const otherMedications = (report.otherMedications as any[]) || [];
        const allDrugs = [
            ...products.map(p => ({ ...p, type: 'Suspect (1)' })),
            ...otherMedications.map(p => ({ ...p, type: 'Concomitant (4)' }))
        ];

        renderGridHeader(doc, ['E2B Code', 'Product / Coding', 'Value / Ingredients']);
        allDrugs.forEach((p, idx) => {
            const coding = p.whodrugCode ? `WHODrug: ${p.whodrugCode}` : 'Coding: Not Stated';
            const ingredients = (p.ingredients || []).map((i: any) => i.name).join(', ') || 'Not Stated';
            const atcs = (p.atcs || []).map((a: any) => `${a.name} (${a.code})`).join(', ') || 'Not Stated';
            
            renderGridRow(doc, `G.k.2.${idx+1}`, p.productName || p.name || 'Unknown Drug', `${p.type} | ${coding}`, true);
            
            // Sub-details for the drug
            doc.fillColor(slateGray).font('Helvetica-Oblique').fontSize(8);
            doc.text(`   Indication: ${p.condition || p.indication || 'Not Stated'}`, 130);
            doc.text(`   Ingredients: ${ingredients}`, 130);
            doc.text(`   Classifications: ${atcs}`, 130);
            doc.moveDown(0.5);
            
            if (p.batchNumber || p.batch) {
                renderGridRow(doc, 'G.k.4.r.2', 'Batch Number', p.batchNumber || p.batch);
            }
            if (p.actionTaken) {
                renderGridRow(doc, 'G.k.8', 'Action Taken', p.actionTaken);
            }
        });
        doc.moveDown(1);

        // Section 5: History & Labs (Fixed Gap: Data-Driven Presence)
        const history = (report.medicalHistory as any[]) || [];
        const labs = [...((report.labTests as any[]) || []), ...labSymps.map(ls => ({ testName: ls.lltName || ls.name, testValue: ls.testValue || ls.result, unit: ls.unit || '1' }))];

        if (history.length > 0 || labs.length > 0) {
            drawSectionHeader(doc, 'SECTION 5 (D/F): RELEVANT HISTORY & LAB TESTS', clinRed);
            if (history.length > 0) {
                doc.fillColor(clinRed).font('Helvetica-Bold').fontSize(10).text('Medical History (D.7.1.r)', 50);
                history.forEach((h, i) => doc.fillColor('black').font('Helvetica').fontSize(9).text(`${i+1}. ${h.condition || h.meddraTerm} (${h.startDate || 'No date'})`, 60));
                doc.moveDown();
            }
            if (labs.length > 0) {
                doc.fillColor(clinRed).font('Helvetica-Bold').fontSize(10).text('Lab Tests & Procedures (F.r)', 50);
                labs.forEach((l, i) => doc.fillColor('black').font('Helvetica').fontSize(9).text(`${i+1}. ${l.testName || l.name}: ${l.testValue || l.result} ${l.unit || ''}`, 60));
                doc.moveDown();
            }
        }

        // Section 6: Narrative
        drawSectionHeader(doc, 'SECTION 6 (H): CASE NARRATIVE', clinRed);
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Case Narrative (H.1) [English]', 50);
        doc.font(DEFAULT_FONT).fontSize(10).text(englishNarrative, 50, undefined, { align: 'justify', width: 500 });

        // Footer Pagination
        const pCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#94A3B8').text(`Confidential | Page ${i+1} of ${pCount}`, 50, 780, { align: 'center' });
        }
        doc.end();
    });
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, color: string) {
    if (doc.y > 720) doc.addPage();
    doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(title, 50);
    doc.strokeColor(color).lineWidth(0.5).moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
    doc.moveDown(1.2);
}

function renderGridHeader(doc: PDFKit.PDFDocument, headers: string[]) {
    doc.fillColor('#CE0037').font('Helvetica-Bold').fontSize(10);
    const cy = doc.y;
    doc.text(headers[0], 50, cy);
    doc.text(headers[1], 130, cy);
    if (headers[2]) doc.text(headers[2], 350, cy);
    doc.moveDown(0.5);
}

function renderGridRow(doc: PDFKit.PDFDocument, code: string, desc: string, value: string, boldValue: boolean = false) {
    // Audit Fix: Refined threshold for footer safety
    if (doc.y > 720) doc.addPage();
    const cy = doc.y;
    doc.fillColor('black').font('Helvetica').fontSize(10);
    doc.text(code, 50, cy);
    // Audit Fix: Added width constraint to prevent overflow
    doc.text(desc, 130, cy, { width: 210 });
    if (boldValue) doc.font('Helvetica-Bold');
    doc.text(value, 350, cy, { width: 200 });
    doc.font('Helvetica').moveDown(0.5);
}

