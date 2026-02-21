import {
  Heading,
  Flex,
  Button,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Box,
  Checkbox,
  Link,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { useStepperContext } from '@saas-ui/react';
import { useFormContext, useWatch } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <Box
      as="span"
      ml={2} px={2} py={1}
      fontSize="xs" fontWeight="500" color="gray.500"
      cursor="pointer" borderRadius="md"
      _hover={{ color: '#CE0037', bg: 'red.50' }}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClick(); }}
    >
      ✎ Edit
    </Box>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const empty = !value || value === '—';
  return (
    <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="gray.100" align="flex-start" gap={4}>
      <Text color="gray.600" fontSize="sm" flex="1">{label}</Text>
      <Text fontWeight="500" fontSize="sm" textAlign="right" color={empty ? 'gray.400' : 'gray.800'}>{value}</Text>
    </Flex>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text fontWeight="600" fontSize="sm" color="gray.700" mt={3} mb={1}>{children}</Text>;
}

interface ReviewConfirmProps {
  accordionIndex: number[];
  setAccordionIndex: (val: number[]) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  captchaChecked: boolean;
  setCaptchaChecked: (val: boolean) => void;
  onBack?: () => void;
  primaryButtonStyles: any;
}

export function ReviewConfirm({
  accordionIndex,
  setAccordionIndex,
  agreedToTerms,
  setAgreedToTerms,
  captchaChecked,
  setCaptchaChecked,
}: ReviewConfirmProps) {
  const { setStep } = useStepperContext();
  const { control, setValue } = useFormContext();

  const products = useWatch({ control, name: 'products' }) ?? [];
  const symptoms = useWatch({ control, name: 'symptoms' }) ?? [];
  const otherMedications = useWatch({ control, name: 'otherMedications' }) ?? [];
  const medicalHistory = useWatch({ control, name: 'medicalHistory' }) ?? [];
  const labTests = useWatch({ control, name: 'labTests' }) ?? [];
  const attachments = useWatch({ control, name: 'attachments' }) ?? [];

  // Step 3 — nested objects
  const patientDetails = useWatch({ control, name: 'patientDetails' }) ?? {};
  const hcpDetails = useWatch({ control, name: 'hcpDetails' }) ?? {};

  const v = (val: any) => (val && String(val).trim() ? String(val) : '—');
  const arr = (val: any) => Array.isArray(val) ? val.join(', ') : '—';
  const ageDisplay = patientDetails.dob
    ? `DOB: ${patientDetails.dob}`
    : patientDetails.ageValue
    ? `${patientDetails.ageValue} years`
    : '—';

  return (
    <>
      <Heading as="h2" size="lg" mb={4} color="gray.800" fontWeight="600">
        Review and confirm your report
      </Heading>
      <Flex justify="flex-end" mb={4}>
        <Button variant="ghost" size="sm" color="gray.600" onClick={() => setAccordionIndex([])}>
          Hide all
        </Button>
      </Flex>

      <Accordion
        allowMultiple
        index={accordionIndex}
        onChange={(exp) => setAccordionIndex(Array.isArray(exp) ? exp : [exp])}
        borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden" mb={6}
      >
        {/* ── PRODUCTS ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Flex align="center" gap={2}>
              <Text>Product details</Text>
              {products.length > 0 && <Badge colorScheme="red" fontSize="xs">{products.length}</Badge>}
            </Flex>
            <EditLink onClick={() => setStep('product')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {products.length === 0 && <Text fontSize="sm" color="gray.400">No products added.</Text>}
            {products.map((p: any, i: number) => (
              <Box key={i} mb={i < products.length - 1 ? 4 : 0}>
                {products.length > 1 && <SectionTitle>Product {i + 1}</SectionTitle>}
                <ReviewRow label="Product name" value={v(p?.productName)} />
                {/* conditions array */}
                {(p?.conditions ?? []).length > 0 && (
                  <ReviewRow
                    label="Conditions"
                    value={(p.conditions as any[]).map((c: any) => c?.name).filter(Boolean).join(', ') || '—'}
                  />
                )}
                <ReviewRow label="Action taken" value={v(p?.actionTaken)} />
                {/* batches */}
                {(p?.batches ?? []).map((b: any, bi: number) => (
                  <Box key={bi} pl={3} borderLeft="2px solid" borderColor="gray.100" mt={2}>
                    <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>Batch {bi + 1}</Text>
                    <ReviewRow label="Batch / lot number" value={v(b?.batchNumber)} />
                    <ReviewRow label="Expiry date" value={v(b?.expiryDate)} />
                    <ReviewRow label="Start date" value={v(b?.startDate)} />
                    <ReviewRow label="End date" value={v(b?.endDate)} />
                    <ReviewRow label="Dosage" value={v(b?.dosage)} />
                  </Box>
                ))}
                {i < products.length - 1 && <Divider my={3} />}
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        {/* ── SYMPTOMS / EVENTS ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Flex align="center" gap={2}>
              <Text>Adverse event details</Text>
              {symptoms.length > 0 && <Badge colorScheme="orange" fontSize="xs">{symptoms.length}</Badge>}
            </Flex>
            <EditLink onClick={() => setStep('event')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {symptoms.length === 0 && <Text fontSize="sm" color="gray.400">No symptoms added.</Text>}
            {symptoms.map((s: any, i: number) => (
              <Box key={i} mb={i < symptoms.length - 1 ? 4 : 0}>
                {symptoms.length > 1 && <SectionTitle>Symptom {i + 1}</SectionTitle>}
                <ReviewRow label="Symptom" value={v(s?.name)} />
                <ReviewRow label="Start date" value={v(s?.eventStartDate)} />
                <ReviewRow label="End date" value={v(s?.eventEndDate)} />
                <ReviewRow label="Was it treated?" value={v(s?.symptomTreated)} />
                {s?.symptomTreated === 'yes' && <ReviewRow label="Treatment" value={v(s?.treatment)} />}
                <ReviewRow label="Seriousness" value={v(s?.seriousness)} />
                <ReviewRow label="Outcome" value={v(s?.outcome)} />
                {i < symptoms.length - 1 && <Divider my={3} />}
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        {/* ── PERSONAL ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Text>Personal details</Text>
            <EditLink onClick={() => setStep('personal')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <SectionTitle>Patient</SectionTitle>
            <ReviewRow label="Full name" value={v(patientDetails.name)} />
            <ReviewRow label="Initials" value={v(patientDetails.initials)} />
            <ReviewRow label="Gender" value={v(patientDetails.gender)} />
            <ReviewRow label="Age / Date of birth" value={ageDisplay} />
            <ReviewRow label="Email" value={v(patientDetails.email)} />
            <ReviewRow label="Contact permission" value={v(patientDetails.contactPermission)} />

            {(hcpDetails.firstName || hcpDetails.lastName || hcpDetails.email || hcpDetails.phone) && (
              <>
                <SectionTitle>Healthcare Professional (HCP)</SectionTitle>
                <ReviewRow label="Name" value={[v(hcpDetails.firstName), v(hcpDetails.lastName)].filter(x => x !== '—').join(' ') || '—'} />
                <ReviewRow label="Email" value={v(hcpDetails.email)} />
                <ReviewRow label="Phone" value={v(hcpDetails.phone)} />
                <ReviewRow label="Institution" value={v(hcpDetails.institution)} />
                <ReviewRow label="Address" value={[v(hcpDetails.address), v(hcpDetails.city), v(hcpDetails.state), v(hcpDetails.country)].filter(x => x !== '—').join(', ') || '—'} />
              </>
            )}
          </AccordionPanel>
        </AccordionItem>

        {/* ── ADDITIONAL ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Text>Additional details</Text>
            <EditLink onClick={() => setStep('additional')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {/* Other medications */}
            {otherMedications.length > 0 ? (
              <>
                <SectionTitle>Other medications ({otherMedications.length})</SectionTitle>
                {otherMedications.map((m: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={`Medication ${i + 1}`} value={v(m?.product)} />
                    <ReviewRow label="Condition" value={v(m?.condition)} />
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label="Other medications" value="None" />
            )}

            {/* Medical history */}
            {medicalHistory.length > 0 ? (
              <>
                <SectionTitle>Medical history ({medicalHistory.length})</SectionTitle>
                {medicalHistory.map((h: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={`Condition ${i + 1}`} value={v(h?.conditionName)} />
                    {h?.info && <ReviewRow label="Additional info" value={v(h?.info)} />}
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label="Medical history" value="None" />
            )}

            {/* Lab tests */}
            {labTests.length > 0 ? (
              <>
                <SectionTitle>Lab tests ({labTests.length})</SectionTitle>
                {labTests.map((t: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={`Test ${i + 1}`} value={v(t?.testName)} />
                    <ReviewRow label="Result" value={[v(t?.testQualifier), v(t?.testValue)].filter(x => x !== '—').join(' ') || '—'} />
                    {t?.outcome?.length > 0 && <ReviewRow label="Outcome" value={arr(t?.outcome)} />}
                    {t?.testComments && <ReviewRow label="Comments" value={v(t?.testComments)} />}
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label="Lab tests" value="None" />
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <>
                <SectionTitle>Attachments</SectionTitle>
                <ReviewRow label="Files uploaded" value={`${attachments.length} image(s)`} />
              </>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* reCAPTCHA */}
      {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
        <Box mb={6}>
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaChecked(!!token)}
            onExpired={() => setCaptchaChecked(false)}
          />
        </Box>
      ) : (
        <Box p={3} mb={6} borderRadius="md" bg="yellow.50" borderWidth="1px" borderColor="yellow.300">
          <Text fontSize="xs" color="yellow.700">
            ⚠️ reCAPTCHA site key missing. Add <strong>VITE_RECAPTCHA_SITE_KEY</strong> to <code>frontend/.env</code>
          </Text>
        </Box>
      )}

      {/* Terms */}
      <Box mb={6} fontSize="sm" color="gray.600">
        <Checkbox
          colorScheme="red"
          isChecked={agreedToTerms}
          onChange={(e) => {
            setAgreedToTerms(e.target.checked);
            setValue('agreedToTerms', e.target.checked);  // ← write into form state for Zod
          }}
        >
          I agree to the processing of my information as described in the{' '}
          <Link href="https://www.takeda.com/privacy-notice/" isExternal color="#CE0037" textDecoration="underline">
            Privacy Notice
          </Link>{' '}
          and{' '}
          <Link href="https://www.takeda.com/terms-and-conditions/" isExternal color="#CE0037" textDecoration="underline">
            Terms and Conditions
          </Link>
          . I consent to Takeda sharing this report with regulatory authorities and other parties as required by law.
        </Checkbox>
      </Box>

      {(!agreedToTerms || !captchaChecked) && (
        <Text fontSize="xs" color="red.400" mb={2}>
          {!captchaChecked && !agreedToTerms
            ? 'Please confirm you are not a robot and agree to the terms to submit.'
            : !captchaChecked
            ? 'Please confirm you are not a robot.'
            : 'Please agree to the terms to submit.'}
        </Text>
      )}
    </>
  );
}
