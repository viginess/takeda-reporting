import { Box, Heading, VStack, Text, Input } from "@chakra-ui/react";
import { formatKey } from "./DataDisplay";

export const EditableSection = ({ title, data, onChange, type = 'input' }: { title: string; data: any; onChange: (val: any) => void, type?: 'input' | 'textarea' }) => {
  if (!data || typeof data !== 'object') return null;

  return (
    <Box mb={6} p={4} border="1px solid" borderColor="gray.100" borderRadius="xl" bg="white">
      <Heading size="xs" mb={4} textTransform="uppercase" color="gray.500" letterSpacing="0.05em">{title}</Heading>
      <VStack align="stretch" spacing={4}>
        {Object.entries(data).map(([key, val]) => {
          if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return null;
          
          const displayVal = Array.isArray(val) 
            ? (val.length > 0 ? JSON.stringify(val) : 'None') 
            : (typeof val === 'object' && val !== null ? JSON.stringify(val) : (val?.toString() || ''));

          return (
            <Box key={key}>
              <Text fontSize="2xs" fontWeight="bold" color="gray.400" mb={1} textTransform="uppercase">{formatKey(key)}</Text>
              {type === 'textarea' || key === 'details' || key === 'medicalHistory' || key === 'otherMedications' || key === 'labTests' ? (
                <Input 
                  as="textarea"
                  size="sm" 
                  minH="80px"
                  py={2}
                  value={displayVal} 
                  onChange={(e) => {
                    let finalVal: any = e.target.value;
                    if (finalVal.startsWith('[') || finalVal.startsWith('{')) {
                      try { finalVal = JSON.parse(finalVal); } catch (e) {}
                    }
                    onChange({ ...data, [key]: finalVal });
                  }}
                  borderColor="gray.200"
                  borderRadius="md"
                  fontSize="xs"
                  _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" }}
                />
              ) : (
                <Input 
                  size="sm" 
                  value={displayVal} 
                  onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                  borderColor="gray.200"
                  borderRadius="md"
                  fontSize="xs"
                  _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" }}
                />
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

export const ReportEditor = ({ reportData, onChange }: { reportData: any; onChange: (newData: any) => void }) => {
  const updateSection = (key: string, val: any) => {
    onChange({ ...reportData, [key]: val });
  };

  return (
    <VStack align="stretch" spacing={2}>
      <EditableSection 
        title="Case Narrative (H.1)" 
        data={{ additionalDetails: reportData.additionalDetails || '' }} 
        onChange={(val) => updateSection('additionalDetails', val.additionalDetails)} 
        type="textarea"
      />
      <EditableSection 
        title="Patient Details" 
        data={reportData.patientDetails} 
        onChange={(val) => updateSection('patientDetails', val)} 
      />
      {reportData.hcpDetails && (
        <EditableSection 
          title="HCP Details" 
          data={reportData.hcpDetails} 
          onChange={(val) => updateSection('hcpDetails', val)} 
        />
      )}
      {reportData.reporterDetails && (
        <EditableSection 
          title="Reporter Details" 
          data={reportData.reporterDetails} 
          onChange={(val) => updateSection('reporterDetails', val)} 
        />
      )}
      {reportData.products && Array.isArray(reportData.products) && reportData.products.length > 0 && (
        <EditableSection 
          title="Primary Product" 
          data={reportData.products[0]} 
          onChange={(val) => {
            const newProducts = [...reportData.products];
            newProducts[0] = val;
            updateSection('products', newProducts);
          }} 
        />
      )}
      {reportData.medicalHistory && (
        <EditableSection 
          title="Medical History" 
          data={reportData.medicalHistory} 
          onChange={(val) => updateSection('medicalHistory', val)} 
        />
      )}
      {reportData.medications && (
        <EditableSection 
          title="Other Medications" 
          data={reportData.medications} 
          onChange={(val) => updateSection('medications', val)} 
        />
      )}
      {reportData.labTests && (
        <EditableSection 
          title="Lab Tests" 
          data={reportData.labTests} 
          onChange={(val) => updateSection('labTests', val)} 
        />
      )}
    </VStack>
  );
};
