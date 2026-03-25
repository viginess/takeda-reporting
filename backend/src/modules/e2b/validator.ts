import { validateXML } from 'xmllint-wasm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates an XML string against E2B R3 (HL7 v3) schemas.
 */
export async function validateE2BR3(xml: string) {
  const schemasDir = path.resolve(__dirname, 'schemas');
  
  // Helper to read schema files safely
  const readSchema = (filename: string) => {
    return fs.readFileSync(path.join(schemasDir, filename), 'utf8');
  };

  const mainSchema = readSchema('MCCI_IN200100UV01.xsd');
  const mtSchema = readSchema('MCCI_MT200100UV.xsd');
  const infraSchema = readSchema('infrastructureRoot.xsd');
  const vocSchema = readSchema('voc.xsd');
  const datatypesSchema = readSchema('datatypes.xsd');

  try {
    // 1. Custom Structural Checks (Check for mandatory HL7 v3 elements)
    const structuralErrors: string[] = [];
    const checkElement = (regex: RegExp, name: string) => {
      if (!regex.test(xml)) structuralErrors.push(`Missing mandatory element: ${name}`);
    };

    checkElement(/<MCCI_IN200100UV01/i, 'Root (MCCI_IN200100UV01)');
    checkElement(/<receiver/i, 'Receiver');
    checkElement(/<sender/i, 'Sender');
    checkElement(/<controlActProcess/i, 'Control Act Process');
    checkElement(/<investigationEvent/i, 'Investigation Event');

    if (structuralErrors.length > 0) {
      return { 
        valid: false, 
        errors: structuralErrors.map(e => ({ message: e, rawMessage: e, loc: null })),
        type: 'structural'
      };
    }

    // 2. Attempt Schema validation (Best effort)
    const result = await validateXML({
      xml: xml,
      schema: [
        { fileName: 'MCCI_IN200100UV01.xsd', contents: mainSchema },
        { fileName: 'MCCI_MT200100UV.xsd', contents: mtSchema },
        { fileName: 'infrastructureRoot.xsd', contents: infraSchema },
        { fileName: 'voc.xsd', contents: vocSchema },
        { fileName: 'datatypes.xsd', contents: datatypesSchema },
      ],
      extension: 'schema'
    });

    return {
      valid: result.valid,
      errors: result.errors,
      type: 'schema',
      schemaStatus: result.rawOutput.includes('failed to compile') ? 'incomplete_schemas' : 'complete'
    };
  } catch (error: any) {
    console.error('Validation Exception:', error);
    return {
      valid: false,
      errors: [{ message: error.message || 'Unknown error', rawMessage: error.message, loc: null }],
      type: 'exception'
    };
  }
}
