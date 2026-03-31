import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Link,
  Spacer,
  ButtonGroup,
  Button,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  FormLayout,
  FormStepper,
  StepsCompleted,
  useStepperContext,
} from '@saas-ui/react';
import { StepForm, SubmitButton, NextButton } from '@saas-ui/forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFamilySchema } from '../../../../backend/src/modules/family/family.validation';

import logo from '../../assets/logo.jpg';
import { ProductDetails } from '../patient-report/components/ProductDetails';
import { EventDetails } from '../patient-report/components/EventDetails';
import { PatientDetails } from '../patient-report/components/PatientDetails';
import { ReporterDetails } from '../patient-report/components/ReporterDetails';
import { AdditionalDetails } from '../patient-report/components/AdditionalDetails';
import { FamilyReviewConfirm } from './components/FamilyReviewConfirm';
import { SuccessStep } from '../../shared/components/SuccessStep';
import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { trpc } from '../../utils/trpc';
import { HiPlus } from 'react-icons/hi2';
import { calculateSeverity } from '../../utils/severity';

const inputStyles = {
  size: 'lg' as const,
  focusBorderColor: '#CE0037',
  borderColor: 'gray.300',
  borderRadius: 'lg',
  _hover: { borderColor: 'gray.400' },
  _focusVisible: {
    borderColor: '#CE0037',
    boxShadow: '0 0 0 1px #CE0037',
  },
};

const primaryButtonStyles = {
  bg: '#CE0037',
  color: 'white',
  fontWeight: 600,
  borderRadius: 'lg',
  _hover: { bg: '#E31C5F', transform: 'translateY(-1px)', boxShadow: 'md' },
  _active: { bg: '#B3002F', transform: 'translateY(0)' },
};

type FamilyFormProps = {
  onBack?: () => void;
  countryCode?: string;
  languageCode?: string;
};

// Wrapper component to provide field array functionality for products
function ProductStep({ inputStyles }: { inputStyles: any }) {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products',
  });

  return (
    <Box mt={12}>
      {fields.map((field, index) => (
        <Box key={field.id} mb={10} position="relative" p={6} border="1px solid" borderColor="gray.100" borderRadius="xl" bg="white" shadow="sm">
          <Flex justify="space-between" align="center" mb={6}>
            <Heading as="h3" size="md" color="gray.700">
              {t('forms.patient.productDetails.productLabel')} #{index + 1}
            </Heading>
            {index > 0 && (
              <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(index)}>
                {t('forms.patient.common.removeProduct')}
              </Button>
            )}
          </Flex>
          <ProductDetails
            inputStyles={inputStyles}
            index={index}
          />
        </Box>
      ))}
      <Button
        leftIcon={<HiPlus />}
        onClick={() => append({ 
          productName: '', 
          conditions: [{ name: '' }], 
          batches: [{ batchNumber: '', expiryDate: '', startDate: '', endDate: '', dosage: '' }] 
        })}
        mb={8}
        width="full"
        bg="#CE0037"
        color="white"
        fontWeight={600}
        borderRadius="lg"
        size="lg"
        _hover={{ bg: '#E31C5F' }}
      >
        {t('forms.patient.productDetails.addProduct', 'Add Another Product')}
      </Button>
    </Box>
  );
}

// Wrapper component to provide field array functionality for symptoms
function EventStep({
  inputStyles,
  symptomTreated,
  setSymptomTreated,
}: {
  inputStyles: any;
  symptomTreated: string;
  setSymptomTreated: (val: string) => void;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'symptoms',
  });

  return (
    <Box mt={12}>
      {fields.map((field, index) => (
        <Box key={field.id} mb={10} position="relative" p={6} border="1px solid" borderColor="gray.100" borderRadius="xl" bg="white" shadow="sm">
          <Flex justify="space-between" align="center" mb={6}>
            <Heading as="h3" size="md" color="gray.700">
               {t('forms.patient.eventDetails.symptom', 'Symptom')} #{index + 1}
            </Heading>
            {index > 0 && (
              <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(index)}>
                {t('forms.patient.common.removeSymptom')}
              </Button>
            )}
          </Flex>
          <EventDetails
            inputStyles={inputStyles}
            index={index}
            symptomNumber={index + 1}
            symptomTreated={symptomTreated}
            setSymptomTreated={setSymptomTreated}
          />
        </Box>
      ))}
      <Button
        leftIcon={<HiPlus />}
        onClick={() => append({ name: '', seriousness: [], outcome: '' })}
        mb={8}
        width="full"
        bg="#CE0037"
        color="white"
        fontWeight={600}
        borderRadius="lg"
        size="lg"
        _hover={{ bg: '#E31C5F' }}
      >
        {t('forms.patient.eventDetails.addSymptom', 'Add Another Symptom')}
      </Button>
    </Box>
  );
}

function PrevButtonTranslatedFamily() {
  const { t } = useTranslation();
  const { prevStep, isFirstStep } = useStepperContext();
  if (isFirstStep) return null;
  return (
    <Button variant="outline" size="lg" borderRadius="lg" onClick={prevStep}>
      {t('common.back', 'Back')}
    </Button>
  );
}

function NextButtonTranslatedFamily(props: any) {
  const { t } = useTranslation();
  return (
    <NextButton size="lg" borderRadius="lg" label={t('common.continue', 'Next')} {...props} />
  );
}

function FormNavigationFamily({ primaryButtonStyles }: { primaryButtonStyles: any }) {
  const { t } = useTranslation();
  const { isCompleted, isLastStep } = useStepperContext();

  if (isCompleted) return null;

  return (
    <ButtonGroup w="full" mt={8}>
      <PrevButtonTranslatedFamily />
      <Spacer />
      {isLastStep ? (
        <SubmitButton {...primaryButtonStyles} size="lg" borderRadius="lg">
          {t('forms.family.submit', 'Submit')}
        </SubmitButton>
      ) : (
        <NextButtonTranslatedFamily {...primaryButtonStyles} />
      )}
    </ButtonGroup>
  );
}

function FamilyForm({ onBack, countryCode, languageCode }: FamilyFormProps) {
  const { t } = useTranslation();
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(!import.meta.env.VITE_RECAPTCHA_SITE_KEY);
  const [accordionIndex, setAccordionIndex] = useState<number[]>([0, 1, 2, 3]);

  // Step state
  const [ageType, setAgeType] = useState<'dob' | 'age' | ''>('');
  const [contactPermission, setContactPermission] = useState('');
  const [hcpContactPermission, setHcpContactPermission] = useState('');
  const [symptomTreated, setSymptomTreated] = useState('');
  const [takingOtherMeds, setTakingOtherMeds] = useState('');
  const [hasRelevantHistory, setHasRelevantHistory] = useState('');
  const [labTestsPerformed, setLabTestsPerformed] = useState('');
  const [submittedId, setSubmittedId] = useState<string | undefined>();
  const toast = useToast();

  const createFamilyReport = trpc.family.create.useMutation({
    onSuccess() {
      toast({
        title: t("success.title", "Report Submitted Successfully"),
        description: t("success.description", "Your report has been successfully submitted."),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError(err) {
      toast({
        title: t("common.error"),
        description: err.message || t("errors.submissionFailed", "Submission failed. Please try again."),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const onSubmit = async (params: any) => {
    try {
      if (!params.captchaChecked || !params.agreedToTerms) {
        toast({
          title: t('common.error', 'Validation Error'),
          description: t('forms.family.reviewConfirm.bothRequired', 'Please confirm you are not a robot and agree to the terms to submit.'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        throw new Error('Validation failed');
      }

      const payload = {
        ...params,
        symptoms: params.symptoms?.map((s: any) => ({
          ...s,
          seriousness: Array.isArray(s.seriousness) ? s.seriousness.join(', ') : s.seriousness,
        })) ?? [],
        patientDetails: {
          ...params.patientDetails,
          contactPermission: contactPermission || undefined,
          ageValue: params.patientDetails?.ageValue ? Number(params.patientDetails.ageValue) : undefined,
        },
        hcpDetails: {
          ...params.hcpDetails,
          contactPermission: hcpContactPermission || undefined,
        },
        takingOtherMeds: takingOtherMeds || undefined,
        hasRelevantHistory: hasRelevantHistory || undefined,
        labTestsPerformed: labTestsPerformed || undefined,
        additionalDetails: additionalDetails || undefined,
        agreedToTerms: params.agreedToTerms,
        senderTimezoneOffset: new Date().getTimezoneOffset(),
        countryCode: countryCode,
        reporterType: "family",
        submissionLanguage: languageCode || "en",
        status: 'new',
        severity: calculateSeverity(params.symptoms),
      };

      const result = await createFamilyReport.mutateAsync(payload);
      if (result?.data?.id) {
        setSubmittedId(result.data.referenceId || result.data.id);
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw error;
    }
  };

  return (
    <Flex
      direction="column"
      minH="100vh"
      bg="gray.50"
      color="gray.800"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      w="full"
    >
      {/* Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px={6}
        py={4}
        bg="white"
        boxShadow="sm"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        {onBack ? (
          <Box as="button" onClick={onBack} p={0} minW="auto" h="auto">
            <Image src={logo} alt="Clin Solutions L.L.C." h="48px" cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
          </Box>
        ) : (
          <Link href="/">
            <Image src={logo} alt="Clin Solutions L.L.C." h="48px" cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
          </Link>
        )}
        <Heading as="h1" size="md" fontWeight="600" color="gray.800">
          {t('forms.family.title')}
        </Heading>
        <Box w="32px" />
      </Flex>

      <Flex flex="1" justify="center" px={{ base: 2, md: 4 }} py={{ base: 4, md: 8 }}>
        <Box maxW="800px" w="full" bg="white" borderRadius="xl" boxShadow="md" p={{ base: 4, sm: 6, md: 10 }}>
          <StepForm
            resolver={zodResolver(createFamilySchema) as any}
            onSubmit={onSubmit}
            onError={(err) => console.error('Form validation failed:', err)}
            defaultValues={{
              products: [
                {
                  productName: '',
                  condition: '',
                  actionTaken: '',
                  batches: [{ batchNumber: '', expiryDate: '', startDate: '', endDate: '', dosage: '' }],
                },
              ],
              symptoms: [{ 
                name: '', 
                eventStartDate: '', 
                eventEndDate: '', 
                symptomTreated: '',
                treatment: '',
                seriousness: [],
                outcome: ''
              }],
              otherMedications: [],
              medicalHistory: [],
              labTests: [],
              agreedToTerms: false,
              captchaChecked: !import.meta.env.VITE_RECAPTCHA_SITE_KEY,
            }}
          >
            {({ FormStep }) => (
              <FormLayout spacing={8}>
                <FormStepper colorScheme="red" mb={10}>
                  <FormStep name="product" title={t('forms.family.steps.product')}>
                    <ProductStep inputStyles={inputStyles} />
                  </FormStep>

                  <FormStep name="event" title={t('forms.family.steps.event')}>
                    <EventStep
                      inputStyles={inputStyles}
                      symptomTreated={symptomTreated}
                      setSymptomTreated={setSymptomTreated}
                    />
                  </FormStep>

                  <FormStep name="patient" title={t('forms.family.steps.patient')}>
                    <Box mt={12}>
                      <PatientDetails
                        inputStyles={inputStyles}
                        ageType={ageType}
                        setAgeType={setAgeType}
                      />
                    </Box>
                  </FormStep>

                  <FormStep name="you" title={t('forms.family.steps.you')}>
                    <Box mt={12}>
                      <ReporterDetails
                        inputStyles={inputStyles}
                        contactPermission={contactPermission}
                        setContactPermission={setContactPermission}
                        hcpContactPermission={hcpContactPermission}
                        setHcpContactPermission={setHcpContactPermission}
                      />
                    </Box>
                  </FormStep>

                  <FormStep name="additional" title={t('forms.family.steps.additional')}>
                    <Box mt={12}>
                      <AdditionalDetails
                        inputStyles={inputStyles}
                        takingOtherMeds={takingOtherMeds}
                        setTakingOtherMeds={setTakingOtherMeds}
                        hasRelevantHistory={hasRelevantHistory}
                        setHasRelevantHistory={setHasRelevantHistory}
                        labTestsPerformed={labTestsPerformed}
                        setLabTestsPerformed={setLabTestsPerformed}
                        additionalDetails={additionalDetails}
                        setAdditionalDetails={setAdditionalDetails}
                      />
                    </Box>
                  </FormStep>

                  <FormStep name="confirm" title={t('forms.family.steps.confirm')}>
                    <Box mt={12}>
                      <FamilyReviewConfirm
                        accordionIndex={accordionIndex}
                        setAccordionIndex={setAccordionIndex}
                        agreedToTerms={agreedToTerms}
                        setAgreedToTerms={setAgreedToTerms}
                        captchaChecked={captchaChecked}
                        setCaptchaChecked={setCaptchaChecked}
                        onBack={onBack}
                        primaryButtonStyles={primaryButtonStyles}
                      />
                    </Box>
                  </FormStep>

                  <StepsCompleted>
                    <SuccessStep 
                        reportId={submittedId}
                        onSubmitAnother={() => window.location.reload()}
                      />
                  </StepsCompleted>
                </FormStepper>

                <FormNavigationFamily primaryButtonStyles={primaryButtonStyles} />
              </FormLayout>
            )}
          </StepForm>
        </Box>
      </Flex>

      {/* Footer */}
      <Box
        as="footer"
        py={4}
        px={6}
        textAlign="center"
        fontSize="sm"
        color="gray.600"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
      >
        <Text>
          {t('welcome.footer')}
        </Text>
        <HStack justify="center" spacing={4} mt={2} fontSize="xs">
          <Link href="/privacy-policy" isExternal color="gray.500" _hover={{ color: '#CE0037' }}>
            Privacy Policy
          </Link>
          <Text color="gray.300">|</Text>
          <Link href="/terms-conditions" isExternal color="gray.500" _hover={{ color: '#CE0037' }}>
            Terms & Conditions
          </Link>
          <Text color="gray.300">|</Text>
          <Link href="/contact" isExternal color="gray.500" _hover={{ color: '#CE0037' }}>
            Contact
          </Link>
        </HStack>
        <Text mt={2} fontSize="2xs">
          Copyright © 2026 Clin Solutions L.L.C.
        </Text>
      </Box>
    </Flex>
  );
}

export default FamilyForm;


