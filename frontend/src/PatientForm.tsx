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
} from '@chakra-ui/react';
import {
  FormLayout,
  PrevButton,
  NextButton,
  FormStepper,
  StepsCompleted,
  LoadingOverlay,
  LoadingSpinner,
  LoadingText,
} from '@saas-ui/react';
import { StepForm } from '@saas-ui/forms';

import takedaLogo from './assets/takeda-logo.png';
import { ProductDetails } from './components/PatientForm/ProductDetails';
import { EventDetails } from './components/PatientForm/EventDetails';
import { PersonalDetails } from './components/PatientForm/PersonalDetails';
import { AdditionalDetails } from './components/PatientForm/AdditionalDetails';
import { ReviewConfirm } from './components/PatientForm/ReviewConfirm';
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

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

type PatientFormProps = {
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

function PatientForm({ onBack }: PatientFormProps) {
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [accordionIndex, setAccordionIndex] = useState<number[]>([0, 1, 2, 3]);

  // Step 3 state
  const [ageType, setAgeType] = useState<'dob' | 'age' | ''>('');
  const [contactPermission, setContactPermission] = useState('');
  const [hcpContactPermission, setHcpContactPermission] = useState('');

  // Step 2 state
  const [symptomTreated, setSymptomTreated] = useState('');

  // Step 4 state
  const [takingOtherMeds, setTakingOtherMeds] = useState('');
  const [hasRelevantHistory, setHasRelevantHistory] = useState('');
  const [labTestsPerformed, setLabTestsPerformed] = useState('');

  const onSubmit = (params: any) => {
    console.log(params);
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  };

  return (
    <Flex direction="column" minH="100vh" bg="gray.50" color="gray.800" w="full">
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
            <Image src={takedaLogo} alt="Takeda" h="32px" cursor="pointer" />
          </Box>
        ) : (
          <Link href="/">
            <Image src={takedaLogo} alt="Takeda" h="32px" cursor="pointer" />
          </Link>
        )}
        <Heading as="h1" size="md" fontWeight="600" color="gray.800">
          Patient Reporting Form
        </Heading>
        <Box w="32px" />
      </Flex>

      <Flex flex="1" justify="center" px={4} py={8}>
        <Box maxW="800px" w="full" bg="white" borderRadius="xl" boxShadow="md" p={10}>
          <StepForm
            onSubmit={onSubmit}
            defaultValues={{
              products: [{ productName: '', condition: '' }],
              symptoms: [{ name: '' }],
              otherMedications: [],
              medicalHistory: [],
              labTests: [],
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

                  <FormStep name="personal" title="You">
                    <Box mt={12}>
                      <PersonalDetails
                        inputStyles={inputStyles}
                        ageType={ageType}
                        setAgeType={setAgeType}
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
                      <ReviewConfirm
                        accordionIndex={accordionIndex}
                        setAccordionIndex={setAccordionIndex}
                        agreedToTerms={agreedToTerms}
                        setAgreedToTerms={setAgreedToTerms}
                        setCurrentStep={() => {}} // Stepper handles this now
                        onBack={onBack}
                        primaryButtonStyles={primaryButtonStyles}
                      />
                    </Box>
                  </FormStep>

                  <StepsCompleted>
                    <LoadingOverlay>
                      <LoadingSpinner />
                      <LoadingText>Submitting your report, please wait...</LoadingText>
                    </LoadingOverlay>
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
          Copyright © 2026 Takeda
        </Text>
      </Box>
    </Flex>
  );
}

export default PatientForm;
