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
} from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';

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

interface HcpReviewConfirmProps {
  accordionIndex: number[];
  setAccordionIndex: (val: number[]) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  onBack?: () => void;
  primaryButtonStyles: any;
}

export function HcpReviewConfirm({
  accordionIndex,
  setAccordionIndex,
  agreedToTerms,
  setAgreedToTerms,
  onBack,
}: HcpReviewConfirmProps) {
  const { watch } = useFormContext();
  const formData = watch();

  const primaryProduct = formData.products?.[0] || {};
  const firstBatch = primaryProduct.batches?.[0] || {};
  const firstSymptom = formData.symptoms?.[0] || {};

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
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="Product name" value={primaryProduct.productName} />
            <ReviewRow label="Condition" value={primaryProduct.conditions?.[0]?.name} />
            <ReviewRow label="Batch/lot number" value={firstBatch.batchNumber} />
            <ReviewRow label="Pharmaceutical dose form" value={primaryProduct.doseForm} />
            <ReviewRow label="Administration route" value={primaryProduct.route} />
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
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="Symptom" value={firstSymptom.name} />
            <ReviewRow
              label="Dates"
              value={firstSymptom.eventStartDate ? `${firstSymptom.eventStartDate} to ${firstSymptom.eventEndDate || 'Ongoing'}` : ''}
            />
            <ReviewRow label="Relationship to product" value={firstSymptom.relationship} />
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
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="Patient ID" value={formData.patientId} />
            <ReviewRow label="Age/DOB" value={formData.age || formData.dob} />
            <ReviewRow label="Sex" value={formData.gender} />
            <ReviewRow label="Height" value={formData.height} />
            <ReviewRow label="Weight" value={formData.weight} />
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
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label="Name" value={`${formData.firstName} ${formData.lastName}`} />
            <ReviewRow label="Hospital/Institution" value={formData.hospital} />
            <ReviewRow label="Country" value={formData.country} />
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
          isChecked={true}
          readOnly
        >
          I&apos;m not a robot
        </Checkbox>
      </Box>

      <Box mb={6} fontSize="sm" color="gray.600">
        <Checkbox
          colorScheme="red"
          isChecked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        >
          I agree to the processing of my information by Takeda for the purposes of managing this report, in accordance with the Privacy Policy.
        </Checkbox>
      </Box>
    </>
  );
}
