import {
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  Box,
  RadioGroup,
  Stack,
  Radio,
  Button,
  Flex,
  Textarea,
  Select,
  CheckboxGroup,
  Checkbox,
} from '@chakra-ui/react';

interface AdditionalDetailsProps {
  inputStyles: any;
  takingOtherMeds: string;
  setTakingOtherMeds: (val: string) => void;
  hasRelevantHistory: string;
  setHasRelevantHistory: (val: string) => void;
  labTestsPerformed: string;
  setLabTestsPerformed: (val: string) => void;
  additionalDetails: string;
  setAdditionalDetails: (val: string) => void;
}

export function AdditionalDetails({
  inputStyles,
  takingOtherMeds,
  setTakingOtherMeds,
  hasRelevantHistory,
  setHasRelevantHistory,
  labTestsPerformed,
  setLabTestsPerformed,
  additionalDetails,
  setAdditionalDetails,
}: AdditionalDetailsProps) {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Just a few more details (Optional)
      </Heading>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Is there any additional documentation or evidence you would like to attach?
        </FormLabel>
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="lg"
          p={8}
          textAlign="center"
          bg="gray.50"
          _hover={{ borderColor: 'gray.400', bg: 'gray.50' }}
          mb={2}
        >
          <Text fontSize="sm" color="gray.500" mb={2}>
            Max files: 3 · Max size per file: 15MB
          </Text>
          <Button variant="outline" size="lg" borderColor="gray.300">
            Upload
          </Button>
        </Box>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Are you taking any other medication?
        </FormLabel>
        <RadioGroup value={takingOtherMeds} onChange={setTakingOtherMeds}>
          <Stack direction="row" spacing={6}>
            <Radio value="yes" colorScheme="red">
              Yes
            </Radio>
            <Radio value="no" colorScheme="red">
              No
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {takingOtherMeds === 'yes' && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            Medication
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              * Please tell us which product
            </FormLabel>
            <Input placeholder="Enter product name" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              What condition are you treating?
            </FormLabel>
            <Input placeholder="Enter condition name" {...inputStyles} />
            <Button variant="outline" size="sm" mt={2} borderColor="gray.300">
              Unknown
            </Button>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              When did you start/stop using this product?
            </FormLabel>
            <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
              <Input
                placeholder="Select start date"
                flex="1"
                minW="140px"
                type="date"
                {...inputStyles}
              />
              <Button variant="outline" size="lg" borderColor="gray.300">
                Unknown
              </Button>
            </Flex>
            <Flex gap={3} flexWrap="wrap" align="center">
              <Input
                placeholder="Select end date"
                flex="1"
                minW="140px"
                type="date"
                {...inputStyles}
              />
              <Button variant="outline" size="lg" borderColor="gray.300">
                Unknown
              </Button>
              <Button variant="outline" size="lg" borderColor="gray.300">
                Ongoing
              </Button>
            </Flex>
          </FormControl>
          <Button variant="link" color="#CE0037" size="sm">
            + Add another medication
          </Button>
        </Box>
      )}

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Is there any relevant medical history you would like to share?
        </FormLabel>
        <RadioGroup value={hasRelevantHistory} onChange={setHasRelevantHistory}>
          <Stack direction="row" spacing={6}>
            <Radio value="yes" colorScheme="red">
              Yes
            </Radio>
            <Radio value="no" colorScheme="red">
              No
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {hasRelevantHistory === 'yes' && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            Relevant medical condition history details
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Name of the medical condition
            </FormLabel>
            <Input placeholder="Enter name of medical condition" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Start and end date of medical condition
            </FormLabel>
            <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
              <Input
                placeholder="Select start date"
                flex="1"
                minW="140px"
                type="date"
                {...inputStyles}
              />
              <Button variant="outline" size="lg" borderColor="gray.300">
                Unknown
              </Button>
            </Flex>
            <Flex gap={3} flexWrap="wrap" align="center">
              <Input
                placeholder="Select end date"
                flex="1"
                minW="140px"
                type="date"
                {...inputStyles}
              />
              <Button variant="outline" size="lg" borderColor="gray.300">
                Unknown
              </Button>
              <Button variant="outline" size="lg" borderColor="gray.300">
                Ongoing
              </Button>
            </Flex>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Additional information on the medical condition
            </FormLabel>
            <Textarea
              placeholder="Enter additional information here"
              rows={4}
              maxLength={500}
              {...inputStyles}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              0/500
            </Text>
          </FormControl>
          <Button variant="link" color="#CE0037" size="sm">
            + Add another condition
          </Button>
        </Box>
      )}

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Were any laboratory or diagnostic tests performed?
        </FormLabel>
        <RadioGroup value={labTestsPerformed} onChange={setLabTestsPerformed}>
          <Stack direction="row" spacing={6}>
            <Radio value="yes" colorScheme="red">
              Yes
            </Radio>
            <Radio value="no" colorScheme="red">
              No
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {labTestsPerformed === 'yes' && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            Were any laboratory or diagnostic tests performed?
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Name of test
            </FormLabel>
            <Input placeholder="Enter test name" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Test result (qualifier/value)
            </FormLabel>
            <Flex gap={3} flexWrap="wrap">
              <Select placeholder="None" flex="1" {...inputStyles}>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="borderline">Borderline</option>
                <option value="inconclusive">Inconclusive</option>
              </Select>
              <Input
                placeholder="Enter value"
                flex="1"
                minW="140px"
                {...inputStyles}
              />
            </Flex>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Outcome of test
            </FormLabel>
            <CheckboxGroup colorScheme="red">
              <Stack spacing={2}>
                <Checkbox value="positive">Positive</Checkbox>
                <Checkbox value="negative">Negative</Checkbox>
                <Checkbox value="borderline">Borderline</Checkbox>
                <Checkbox value="inconclusive">Inconclusive</Checkbox>
              </Stack>
            </CheckboxGroup>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Test results comments
            </FormLabel>
            <Textarea
              placeholder="Enter additional information here"
              rows={4}
              {...inputStyles}
            />
          </FormControl>
          <Button variant="link" color="#CE0037" size="sm">
            + Add another test result
          </Button>
        </Box>
      )}

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Is there anything else you would like to share?
        </FormLabel>
        <Textarea
          placeholder="Enter additional details here"
          rows={5}
          maxLength={10000}
          value={additionalDetails}
          onChange={(e) => setAdditionalDetails(e.target.value)}
          {...inputStyles}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          {additionalDetails.length}/10000
        </Text>
      </FormControl>
    </>
  );
}
