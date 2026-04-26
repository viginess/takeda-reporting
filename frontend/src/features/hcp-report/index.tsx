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
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  FormLayout,
  FormStepper,
  StepsCompleted,
  useStepperContext,
} from '@saas-ui/react';
import { StepForm, SubmitButton, NextButton } from '@saas-ui/forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { createHcpSchema } from '../../../../backend/src/modules/hcp/hcp.validation';

import logo from '../../assets/logo.jpg';
import { HcpProductDetails } from './components/HcpProductDetails';
import { HcpEventDetails } from './components/HcpEventDetails';
import { HcpPatientDetails } from './components/HcpPatientDetails';
import { HcpReporterDetails } from './components/HcpReporterDetails';
import { HcpAdditionalDetails } from './components/HcpAdditionalDetails';
import { HcpReviewConfirm } from './components/HcpReviewConfirm';
import { SuccessStep } from '../../shared/components/common/SuccessStep';
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { HiPlus } from 'react-icons/hi2';
import { trpc } from '../../utils/config/trpc';
import { calculateSeverity } from '../../utils/common/severity';

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

type HcpFormProps = {
  onBack?: () => void;
  countryCode?: string;
  languageCode?: string;
};

// Wrapper component to provide field array functionality for products
function ProductStep({ inputStyles }: { inputStyles: any }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products',
  });

  return (
    <Box mt={12}>
      {fields.map((field, index) => (
        <Box key={field.id} mb={10} position="relative" p={{ base: 4, md: 6 }} border="1px solid" borderColor="gray.100" borderRadius="xl" bg="white" shadow="sm">
          {index > 0 && (
            <Flex justify="flex-end" mb={2}>
              <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(index)}>
                Remove product
              </Button>
            </Flex>
          )}
          <HcpProductDetails
            inputStyles={inputStyles}
            index={index}
            onAddProduct={() => append({ productName: '', whodrugCode: '', condition: '' })}
          />
          {index < fields.length - 1 && <Box borderBottom="1px solid" borderColor="gray.100" my={10} />}
        </Box>
      ))}
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
        <Box key={field.id} mb={10} position="relative" p={{ base: 4, md: 6 }} border="1px solid" borderColor="gray.100" borderRadius="xl" bg="white" shadow="sm">
          {index > 0 && (
            <Flex justify="flex-end" mb={2}>
              <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(index)}>
                Remove symptom
              </Button>
            </Flex>
          )}
          <HcpEventDetails
            inputStyles={inputStyles}
            index={index}
            symptomNumber={index + 1}
            symptomTreated={symptomTreated}
            setSymptomTreated={setSymptomTreated}
          />
        </Box>
      ))}
      <Button
        mb={8}
        width="full"
        bg="#CE0037"
        color="white"
        fontWeight={600}
        borderRadius="lg"
        size="lg"
        _hover={{ bg: '#E31C5F' }}
        leftIcon={<HiPlus />}
        onClick={() => append({ name: '', seriousness: [], outcome: '' })}
      >
        {t('forms.patient.eventDetails.addAnother')}
      </Button>
    </Box>
  );
}

function PrevButtonTranslatedHcp() {
  const { t } = useTranslation();
  const { prevStep, isFirstStep } = useStepperContext();
  if (isFirstStep) return null;
  return (
    <Button variant="outline" size="lg" borderRadius="lg" onClick={prevStep}>
      {t('common.back', 'Back')}
    </Button>
  );
}

function NextButtonTranslatedHcp(props: any) {
  const { t } = useTranslation();
  return (
    <NextButton size="lg" borderRadius="lg" label={t('common.continue', 'Next')} {...props} />
  );
}

function FormNavigationHcp({ primaryButtonStyles }: { primaryButtonStyles: any }) {
  const { t } = useTranslation();
  const { isCompleted, isLastStep } = useStepperContext();

  if (isCompleted) return null;

  return (
    <ButtonGroup w="full" mt={8}>
      <PrevButtonTranslatedHcp />
      <Spacer />
      {isLastStep ? (
        <SubmitButton {...primaryButtonStyles} size="lg" borderRadius="lg">
          {t('forms.hcp.submit', 'Submit')}
        </SubmitButton>
      ) : (
        <NextButtonTranslatedHcp {...primaryButtonStyles} />
      )}
    </ButtonGroup>
  );
}

function HcpForm({ onBack, countryCode, languageCode }: HcpFormProps) {
  const { t } = useTranslation();
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(
    !import.meta.env.VITE_RECAPTCHA_SITE_KEY ? 'bypass' : null
  );
  const [accordionIndex, setAccordionIndex] = useState<number[]>([0, 1, 2, 3]);

  // Step state
  const [ageType, setAgeType] = useState<'dob' | 'age' | ''>('');
  const [contactPermission, setContactPermission] = useState('');
  const [symptomTreated, setSymptomTreated] = useState('');
  const [takingOtherMeds, setTakingOtherMeds] = useState('');
  const [hasRelevantHistory, setHasRelevantHistory] = useState('');
  const [labTestsPerformed, setLabTestsPerformed] = useState('');
  const [submittedId, setSubmittedId] = useState<string | undefined>();
  const toast = useToast();

  const createHcpReport = trpc.hcp.create.useMutation({
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
      if (!params.captchaToken || !params.agreedToTerms) {
        toast({
          title: t("common.error", 'Validation Error'),
          description: t("forms.hcp.reviewConfirm.bothRequired", 'Please confirm you are not a robot and agree to the terms to submit.'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        throw new Error('Validation failed');
      }
      
      const payload = {
        ...params,
        severity: calculateSeverity(params.symptoms),
        symptoms: params.symptoms?.map((s: any) => ({
          ...s,
          seriousness: Array.isArray(s.seriousness) ? s.seriousness.join(', ') : s.seriousness,
        })) ?? [],
        patientDetails: {
          initials: params.patientInitials,
          dob: params.patientDob,
          age: params.patientAge ? Number(params.patientAge) : undefined,
          gender: params.patientGender,
          reference: params.patientReference,
          height: params.patientHeight,
          weight: params.patientWeight,
        },
        reporterDetails: {
          ...params.reporterDetails,
          contactPermission: contactPermission || params.reporterDetails?.contactPermission,
        },
        takingOtherMeds: takingOtherMeds || undefined,
        hasRelevantHistory: hasRelevantHistory || undefined,
        labTestsPerformed: labTestsPerformed || undefined,
        additionalDetails: additionalDetails || undefined,
        agreedToTerms: params.agreedToTerms,
        captchaToken: params.captchaToken,
        reporterType: "hcp",
        senderTimezoneOffset: new Date().getTimezoneOffset(),
        countryCode: countryCode,
        submissionLanguage: languageCode || "en",
        status: 'new',
      };

      const result = await createHcpReport.mutateAsync(payload);
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
      <Helmet>
        <title>{t('forms.hcp.title')} | Clin Solutions L.L.C. Pharmaceuticals</title>
        <meta name="description" content="Secure portal for healthcare professionals to report adverse events and patient safety observations." />
      </Helmet>
      {/* Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px={{ base: 4, md: 6 }}
        py={{ base: 3, md: 4 }}
        bg="white"
        boxShadow="sm"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        {onBack ? (
          <Box as="button" onClick={onBack} p={0} minW="auto" h="auto">
            <Image src={logo} alt="Clin Solutions L.L.C." h={{ base: "32px", md: "48px" }} cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
          </Box>
        ) : (
          <Link href="/">
            <Image src={logo} alt="Clin Solutions L.L.C." h={{ base: "32px", md: "48px" }} cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
          </Link>
        )}
        <Heading 
          as="h1" 
          size={{ base: "xs", sm: "sm", md: "md" }} 
          fontWeight="600" 
          color="gray.800"
          noOfLines={1}
          ml={2}
        >
          {t('forms.hcp.title')}
        </Heading>
        <Box w={{ base: "0px", sm: "32px" }} />
      </Flex>

      <Flex flex="1" justify="center" px={{ base: 2, sm: 4, md: 4 }} py={{ base: 4, md: 8 }}>
        <Box maxW="800px" w="full" bg="white" borderRadius="xl" boxShadow="md" p={{ base: 4, sm: 6, md: 10 }}>
          <StepForm
            resolver={zodResolver(createHcpSchema) as any}
            onSubmit={onSubmit}
            onError={(err) => console.error('Form validation failed:', err)}
            defaultValues={{
              products: [
                {
                  productName: '',
                  manufacturerName: '',
                  whodrugCode: '',
                  condition: '',
                  doseForm: '',
                  route: '',
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
              patientInitials: '',
              patientAge: '',
              patientDob: '',
              patientGender: '',
              patientReference: '',
              patientHeight: '',
              patientWeight: '',
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              institution: '',
              address: '',
              city: '',
              state: '',
              zipCode: '',
              country: '',
              contactPermission: '',
              otherMedications: [],
              medicalHistory: [],
              labTests: [],
              agreedToTerms: false,
              captchaToken: !import.meta.env.VITE_RECAPTCHA_SITE_KEY ? 'bypass' : null,
            }}
          >
            {({ FormStep }) => (
              <FormLayout spacing={8}>
                <FormStepper colorScheme="red" mb={10} size={{ base: "sm", md: "md" }}>
                  <FormStep name="product" title={t('forms.hcp.steps.product')}>
                    <ProductStep inputStyles={inputStyles} />
                  </FormStep>

                  <FormStep name="event" title={t('forms.hcp.steps.event')}>
                    <EventStep
                      inputStyles={inputStyles}
                      symptomTreated={symptomTreated}
                      setSymptomTreated={setSymptomTreated}
                    />
                  </FormStep>

                  <FormStep name="patient" title={t('forms.hcp.steps.patient')}>
                    <Box mt={12}>
                      <HcpPatientDetails
                        inputStyles={inputStyles}
                        ageType={ageType}
                        setAgeType={setAgeType}
                      />
                    </Box>
                  </FormStep>

                  <FormStep name="you" title={t('forms.hcp.steps.you')}>
                    <Box mt={12}>
                      <HcpReporterDetails
                        inputStyles={inputStyles}
                        contactPermission={contactPermission}
                        setContactPermission={setContactPermission}
                      />
                    </Box>
                  </FormStep>

                  <FormStep name="additional" title={t('forms.hcp.steps.additional')}>
                    <Box mt={12}>
                      <HcpAdditionalDetails
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

                  <FormStep name="confirm" title={t('forms.hcp.steps.confirm')}>
                    <Box mt={12}>
                      <HcpReviewConfirm
                        accordionIndex={accordionIndex}
                        setAccordionIndex={setAccordionIndex}
                        agreedToTerms={agreedToTerms}
                        setAgreedToTerms={setAgreedToTerms}
                        captchaToken={captchaToken}
                        setCaptchaToken={setCaptchaToken}
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

                <FormNavigationHcp primaryButtonStyles={primaryButtonStyles} />
              </FormLayout>
            )}
          </StepForm>
        </Box>
      </Flex>

      {/* Footer */}
      <Box
        as="footer"
        py={6}
        px={6}
        textAlign="center"
        fontSize="sm"
        color="gray.600"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
      >
        <Text mb={4}>
          {t('welcome.footer')}
        </Text>
        <Wrap justify="center" spacing={{ base: 2, md: 4 }} align="center" fontSize="xs">
          <WrapItem>
            <Link href="/privacy-policy" isExternal color="gray.500" _hover={{ color: '#CE0037' }}>
              Privacy Policy
            </Link>
          </WrapItem>
          <WrapItem display={{ base: 'none', sm: 'block' }}>
            <Text color="gray.300">|</Text>
          </WrapItem>
          <WrapItem>
            <Link href="/terms-conditions" isExternal color="gray.500" _hover={{ color: '#CE0037' }}>
              Terms & Conditions
            </Link>
          </WrapItem>
          <WrapItem display={{ base: 'none', sm: 'block' }}>
            <Text color="gray.300">|</Text>
          </WrapItem>
          <WrapItem>
            <Link href="/contact" isExternal color="gray.500" _hover={{ color: '#CE0037' }}>
              Contact
            </Link>
          </WrapItem>
        </Wrap>
        <Text mt={4} fontSize="2xs">
          Copyright © 2026 Clin Solutions L.L.C.
        </Text>
      </Box>
    </Flex>
  );
}

export default HcpForm;

