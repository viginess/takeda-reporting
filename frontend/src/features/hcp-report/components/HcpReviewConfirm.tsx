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
} from '@chakra-ui/react';
import { useStepperContext } from '@saas-ui/react';
import { useFormContext } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReviewRowProps {
  label: string;
  value: string;
}

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <Flex
      justify="space-between"
      py={2}
      borderBottom="1px solid"
      borderColor="gray.100"
      align="center"
    >
      <Text color="gray.600" fontSize="sm">
        {label}
      </Text>
      <Text fontWeight="500" fontSize="sm">
        {value || '—'}
      </Text>
    </Flex>
  );
}

const v = (value: string | undefined | null) => value || '—';
const arr = (value: string[] | undefined | null) => (value?.length ? value.join(', ') : '—');

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text fontWeight="600" mt={4} mb={2} color="gray.700" fontSize="md" borderBottom="1px solid" borderColor="gray.100" pb={1}>
    {children}
  </Text>
);

interface HcpReviewConfirmProps {
  accordionIndex: number[];
  setAccordionIndex: (val: number[]) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  captchaChecked: boolean;
  setCaptchaChecked: (val: boolean) => void;
  onBack?: () => void;
  primaryButtonStyles: any;
}

export function HcpReviewConfirm({
  accordionIndex,
  setAccordionIndex,
  agreedToTerms,
  setAgreedToTerms,
  captchaChecked,
  setCaptchaChecked,
  onBack,
}: HcpReviewConfirmProps) {
  const { setStep } = useStepperContext();
  const { watch, setValue, register } = useFormContext();
  const formData = watch();

  return (
    <>
      <Heading as="h2" size="lg" mb={4} color="gray.800" fontWeight="600">
        Review and confirm all sections of the report
      </Heading>
      <Flex justify="flex-end" mb={4}>
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          onClick={() => setAccordionIndex([])}
        >
          Hide all
        </Button>
      </Flex>

      <Accordion
        allowMultiple
        index={accordionIndex}
        onChange={(expanded) =>
          setAccordionIndex(Array.isArray(expanded) ? expanded : [expanded])
        }
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        overflow="hidden"
        mb={6}
      >
        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>Please select who you are.</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                onBack?.();
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="gray.100">
              <Text color="gray.600">I am...</Text>
              <Text fontWeight="500">A Healthcare Professional</Text>
            </Flex>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>Product details {formData.products?.length > 1 && `(${formData.products.length} products)`}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('product');
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {(formData.products || []).map((p: any, index: number) => (
              <Box key={index} mb={index < formData.products.length - 1 ? 6 : 0}>
                {formData.products.length > 1 && <SectionTitle>Product {index + 1}</SectionTitle>}
                <ReviewRow label="Product name" value={v(p.productName)} />
                <ReviewRow label="Condition" value={v(p.conditions?.[0]?.name)} />
                <ReviewRow label="Batch/lot number" value={v(p.batches?.[0]?.batchNumber)} />
                <ReviewRow label="Pharmaceutical dose form" value={v(p.doseForm)} />
                <ReviewRow label="Administration route" value={v(p.route)} />
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>Adverse event details {formData.symptoms?.length > 1 && `(${formData.symptoms.length} symptoms)`}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('event');
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {(formData.symptoms || []).map((s: any, index: number) => (
              <Box key={index} mb={index < formData.symptoms.length - 1 ? 6 : 0}>
                {formData.symptoms.length > 1 && <SectionTitle>Event {index + 1}</SectionTitle>}
                <ReviewRow label="Symptom" value={v(s.name)} />
                <ReviewRow label="Dates" value={(s.eventStartDate || s.eventEndDate) ? `${s.eventStartDate || '?'} to ${s.eventEndDate || 'Ongoing'}` : '—'} />
                <ReviewRow label="Relationship to product" value={v(s.relationship)} />
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>Patient details</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('patient');
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="Patient Initials" value={v(formData.patientInitials)} />
            <ReviewRow label="Age/DOB" value={v(formData.age || formData.dob)} />
            <ReviewRow label="Sex" value={v(formData.gender)} />
            <ReviewRow label="Height" value={v(formData.height)} />
            <ReviewRow label="Weight" value={v(formData.weight)} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>Reporter information</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('you');
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="Name" value={[v(formData.firstName), v(formData.lastName)].filter(x => x !== '—').join(' ') || '—'} />
            <ReviewRow label="Hospital/Institution" value={v(formData.institution)} />
            <ReviewRow label="Email" value={v(formData.email)} />
            <ReviewRow label="Phone" value={v(formData.phone)} />
            <ReviewRow label="Address" value={[v(formData.address), v(formData.city), v(formData.state), v(formData.country)].filter(x => x !== '—').join(', ') || '—'} />
            <ReviewRow label="Contact Permission" value={v(formData.contactPermission)} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Text>Additional details</Text>
            <Button size="sm" variant="ghost" leftIcon={<span>✎</span>} onClick={(e) => { e.stopPropagation(); setStep('additional'); }}>Edit</Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {/* Other medications */}
            {(formData.otherMedications?.length > 0) ? (
              <>
                <SectionTitle>Other medications ({formData.otherMedications.length})</SectionTitle>
                {formData.otherMedications.map((m: any, i: number) => (
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
            {(formData.medicalHistory?.length > 0) ? (
              <>
                <SectionTitle>Medical history ({formData.medicalHistory.length})</SectionTitle>
                {formData.medicalHistory.map((h: any, i: number) => (
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
            {(formData.labTests?.length > 0) ? (
              <>
                <SectionTitle>Lab tests ({formData.labTests.length})</SectionTitle>
                {formData.labTests.map((t: any, i: number) => (
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

            {/* Additional Info */}
            <SectionTitle>Other information</SectionTitle>
            <ReviewRow label="Additional details" value={v(formData.additionalDetails)} />
            <ReviewRow label="Attachments" value={formData.attachments?.length ? `${formData.attachments.length} file(s)` : 'None'} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* reCAPTCHA */}
      <input type="hidden" {...register('captchaChecked', { required: true, validate: (v: any) => v === true })} />
      {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
        <Box mb={6}>
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => {
              setCaptchaChecked(!!token);
              setValue('captchaChecked', !!token, { shouldValidate: true });
            }}
            onExpired={() => {
              setCaptchaChecked(false);
              setValue('captchaChecked', false, { shouldValidate: true });
            }}
          />
        </Box>
      ) : (
        <Box p={3} mb={6} borderRadius="md" bg="yellow.50" borderWidth="1px" borderColor="yellow.300">
          <Text fontSize="xs" color="yellow.700">
            reCAPTCHA site key missing. Add <strong>VITE_RECAPTCHA_SITE_KEY</strong> to <code>frontend/.env</code>
          </Text>
        </Box>
      )}

      {/* Terms */}
      <Box mb={6} fontSize="sm" color="gray.600">
        <Checkbox
          colorScheme="red"
          isChecked={agreedToTerms}
          {...register('agreedToTerms', { required: true })}
          onChange={(e) => {
            setAgreedToTerms(e.target.checked);
            setValue('agreedToTerms', e.target.checked, { shouldValidate: true });
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
          . I consent to Takeda sharing this report with regulatory authorities and
          other parties as required by law.
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
