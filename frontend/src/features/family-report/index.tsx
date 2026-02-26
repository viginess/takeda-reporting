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
} from '@chakra-ui/react';
import {
  FormLayout,
  PrevButton,
  NextButton,
  FormStepper,
  StepsCompleted,

} from '@saas-ui/react';
import { StepForm } from '@saas-ui/forms';

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
        <Box key={field.id} mb={10} position="relative">
          {index > 0 && (
            <Flex justify="flex-end" mb={2}>
              <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(index)}>
                Remove product
              </Button>
            </Flex>
          )}
          <ProductDetails
            inputStyles={inputStyles}
            index={index}
            onAddProduct={() => append({ productName: '', condition: '' })}
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
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'symptoms',
  });

  return (
    <Box mt={12}>
      {fields.map((field, index) => (
        <Box key={field.id} mb={10} position="relative">
          {index > 0 && (
            <Flex justify="flex-end" mb={2}>
              <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(index)}>
                Remove symptom
              </Button>
            </Flex>
          )}
          <EventDetails
            inputStyles={inputStyles}
            index={index}
            symptomTreated={symptomTreated}
            setSymptomTreated={setSymptomTreated}
            onAddSymptom={() => append({ name: '' })}
          />
          {index < fields.length - 1 && <Box borderBottom="1px solid" borderColor="gray.100" my={10} />}
        </Box>
      ))}
    </Box>
  );
}

function FamilyForm({ onBack }: FamilyFormProps) {
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
    onError(err) {
      toast({
        title: 'Submission failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const onSubmit = async (params: any) => {
    console.error('apicalls',params);
    try {
      if (!params.captchaChecked || !params.agreedToTerms) {
        toast({
          title: 'Validation Error',
          description: 'Please confirm you are not a robot and agree to the terms to submit.',
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
        status: 'new',
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
          Family Reporting Form
        </Heading>
        <Box w="32px" />
      </Flex>

      <Flex flex="1" justify="center" px={4} py={8}>
        <Box maxW="800px" w="full" bg="white" borderRadius="xl" boxShadow="md" p={10}>
          <StepForm
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
                  <FormStep name="product" title="Product">
                    <ProductStep inputStyles={inputStyles} />
                  </FormStep>

                  <FormStep name="event" title="Event">
                    <EventStep
                      inputStyles={inputStyles}
                      symptomTreated={symptomTreated}
                      setSymptomTreated={setSymptomTreated}
                    />
                  </FormStep>

                  <FormStep name="patient" title="Patient">
                    <Box mt={12}>
                      <PatientDetails
                        inputStyles={inputStyles}
                        ageType={ageType}
                        setAgeType={setAgeType}
                      />
                    </Box>
                  </FormStep>

                  <FormStep name="you" title="You">
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

                  <FormStep name="additional" title="Additional">
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

                  <FormStep name="confirm" title="Confirm">
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

                <ButtonGroup w="full" mt={8}>
                  <PrevButton variant="outline" size="lg" />
                  <Spacer />
                  <NextButton size="lg" {...primaryButtonStyles} />
                </ButtonGroup>
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
          Thank you for helping us make our products safer and more effective for everyone,
          everywhere.
        </Text>
        <Text mt={1} fontSize="xs">
          Copyright © 2026 Clin Solutions L.L.C.
        </Text>
      </Box>
    </Flex>
  );
}

export default FamilyForm;


