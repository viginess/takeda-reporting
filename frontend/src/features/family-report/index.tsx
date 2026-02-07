import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Link,
  Spacer,
  ButtonGroup,
} from '@chakra-ui/react';
import {
  FormLayout,
  PrevButton,
  NextButton,
  FormStepper,
  StepsCompleted,

} from '@saas-ui/react';
import { StepForm } from '@saas-ui/forms';

import takedaLogo from '../../assets/takeda-logo.png';
import { ProductDetails } from '../patient-report/components/ProductDetails';
import { EventDetails } from '../patient-report/components/EventDetails';
import { PatientDetails } from '../patient-report/components/PatientDetails';
import { ReporterDetails } from '../patient-report/components/ReporterDetails';
import { AdditionalDetails } from '../patient-report/components/AdditionalDetails';
import { FamilyReviewConfirm } from './components/FamilyReviewConfirm';
import { SuccessStep } from '../../components/SuccessStep';
import { useState } from 'react';

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

function FamilyForm({ onBack }: FamilyFormProps) {
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [accordionIndex, setAccordionIndex] = useState<number[]>([0, 1, 2, 3]);

  // Step state
  const [ageType, setAgeType] = useState<'dob' | 'age' | ''>('');
  const [contactPermission, setContactPermission] = useState('');
  const [hcpContactPermission, setHcpContactPermission] = useState('');
  const [symptomTreated, setSymptomTreated] = useState('');
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
            <Image src={takedaLogo} alt="Takeda" h="32px" cursor="pointer" />
          </Box>
        ) : (
          <Link href="/">
            <Image src={takedaLogo} alt="Takeda" h="32px" cursor="pointer" />
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
            defaultValues={{
              productName: '',
              symptoms: '',
            }}
          >
            {({ FormStep }) => (
              <FormLayout spacing={8}>
                <FormStepper colorScheme="red" mb={10}>
                  <FormStep name="product" title="Product">
                    <Box mt={12}>
                      <ProductDetails inputStyles={inputStyles} />
                    </Box>
                  </FormStep>

                  <FormStep name="event" title="Event">
                    <Box mt={12}>
                      <EventDetails
                        inputStyles={inputStyles}
                        symptomTreated={symptomTreated}
                        setSymptomTreated={setSymptomTreated}
                      />
                    </Box>
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
                        setCurrentStep={() => {}} 
                        onBack={onBack}
                        primaryButtonStyles={primaryButtonStyles}
                      />
                    </Box>
                  </FormStep>

                  <StepsCompleted>
                    <SuccessStep 
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
          Copyright © 2026 Takeda
        </Text>
      </Box>
    </Flex>
  );
}

export default FamilyForm;


