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
        {value}
      </Text>
    </Flex>
  );
}

interface ReviewConfirmProps {
  accordionIndex: number[];
  setAccordionIndex: (val: number[]) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  setCurrentStep: (val: 1 | 2 | 3 | 4 | 5) => void;
  onBack?: () => void;
  primaryButtonStyles: any;
}

export function ReviewConfirm({
  accordionIndex,
  setAccordionIndex,
  agreedToTerms,
  setAgreedToTerms,
  setCurrentStep,
  onBack,
}: ReviewConfirmProps) {
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
              <Text fontWeight="500">A Patient or Consumer</Text>
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
            <Text>Product details</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentStep(1);
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="For which product do you want to report a potential concern?" value="—" />
            <ReviewRow label="What condition are you treating?" value="—" />
            <ReviewRow label="Batch/lot number" value="—" />
            <ReviewRow label="Expiry date" value="—" />
            <ReviewRow label="When did you start using this batch?" value="—" />
            <ReviewRow label="When did you stop using this batch?" value="—" />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>Adverse event details</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentStep(2);
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="What are your symptoms?" value="—" />
            <ReviewRow label="On which date did you first experience your symptom?" value="—" />
            <ReviewRow label="On which date did you last experience your symptom?" value="—" />
            <ReviewRow label="Was the symptom treated?" value="—" />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>Personal details</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentStep(3);
              }}
            >
              Edit
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="Initials" value="—" />
            <ReviewRow label="Age (Select one)" value="—" />
            <ReviewRow label="Do we have permission to contact you?" value="—" />
            <Text fontWeight="600" mt={3} mb={2} color="gray.700">
              Your contact information
            </Text>
            <ReviewRow label="Email address" value="—" />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Box
        p={4}
        mb={6}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        bg="gray.50"
      >
        <Checkbox
          colorScheme="red"
          isChecked={false}
          onChange={() => {}}
        >
          I&apos;m not a robot
        </Checkbox>
        <Text fontSize="xs" color="gray.500" mt={2}>
          reCAPTCHA placeholder
        </Text>
      </Box>

      <Box mb={6} fontSize="sm" color="gray.600">
        <Checkbox
          colorScheme="red"
          isChecked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        >
          I agree to the processing of my information as described in the{' '}
          <Link href="#" color="#CE0037" textDecoration="underline">
            Privacy Statement
          </Link>{' '}
          and{' '}
          <Link href="#" color="#CE0037" textDecoration="underline">
            Consumer Health Notice
          </Link>
          . I consent to Takeda sharing this report with regulatory authorities and
          other parties as required by law.
        </Checkbox>
      </Box>
    </>
  );
}
