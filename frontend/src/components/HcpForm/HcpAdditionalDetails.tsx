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
  VStack,
} from '@chakra-ui/react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { HiPlus } from 'react-icons/hi2';

interface HcpAdditionalDetailsProps {
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

export function HcpAdditionalDetails({
  inputStyles,
  takingOtherMeds,
  setTakingOtherMeds,
  hasRelevantHistory,
  setHasRelevantHistory,
  labTestsPerformed,
  setLabTestsPerformed,
  additionalDetails,
  setAdditionalDetails,
}: HcpAdditionalDetailsProps) {
  const { setValue, register, control } = useFormContext();

  const {
    fields: otherMedFields,
    append: appendOtherMed,
    remove: removeOtherMed,
  } = useFieldArray({
    control,
    name: 'otherMedications',
  });

  const {
    fields: historyFields,
    append: appendHistory,
    remove: removeHistory,
  } = useFieldArray({
    control,
    name: 'medicalHistory',
  });

  const {
    fields: labTestFields,
    append: appendLabTest,
    remove: removeLabTest,
  } = useFieldArray({
    control,
    name: 'labTests',
  });

  // Initialize field arrays if empty when section is visible
  if (takingOtherMeds === 'yes' && otherMedFields.length === 0) {
    appendOtherMed({ product: '', condition: '' });
  }
  if (hasRelevantHistory === 'yes' && historyFields.length === 0) {
    appendHistory({ conditionName: '' });
  }
  if (labTestsPerformed === 'yes' && labTestFields.length === 0) {
    appendLabTest({ testName: '' });
  }

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
        <VStack spacing={6} align="stretch" mb={8}>
          {otherMedFields.map((field, index) => (
            <Box
              key={field.id}
              p={4}
              bg="gray.50"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="600" color="gray.700">
                  Medication {index + 1}
                </Text>
                {index > 0 && (
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeOtherMed(index)}>
                    Remove
                  </Button>
                )}
              </Flex>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  * Please tell us which product
                </FormLabel>
                <Input
                  placeholder="Enter product name"
                  {...inputStyles}
                  {...register(`otherMedications.${index}.product`)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  What condition are you treating?
                </FormLabel>
                <Input
                  placeholder="Enter condition name"
                  {...inputStyles}
                  {...register(`otherMedications.${index}.condition`)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  mt={2}
                  borderColor="gray.300"
                  onClick={() => setValue(`otherMedications.${index}.condition`, 'Unknown')}
                >
                  Unknown
                </Button>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  When did you start/stop using this product?
                </FormLabel>
                <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
                  <Input
                    type='date'
                    placeholder="Select start date"
                    flex="1"
                    minW="140px"
                    {...inputStyles}
                    {...register(`otherMedications.${index}.startDate`)}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`otherMedications.${index}.startDate`, 'Unknown')}
                  >
                    Unknown
                  </Button>
                </Flex>
                <Flex gap={3} flexWrap="wrap" align="center">
                  <Input
                    type='date'
                    placeholder="Select end date"
                    flex="1"
                    minW="140px"
                    {...inputStyles}
                    {...register(`otherMedications.${index}.endDate`)}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`otherMedications.${index}.endDate`, 'Unknown')}
                  >
                    Unknown
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`otherMedications.${index}.endDate`, 'Ongoing')}
                  >
                    Ongoing
                  </Button>
                </Flex>
              </FormControl>
            </Box>
          ))}
          <Button
            variant="ghost"
            size="sm"
            color="#CE0037"
            leftIcon={<HiPlus />}
            onClick={() => appendOtherMed({ product: '', condition: '' })}
            alignSelf="flex-start"
          >
            Add another medication
          </Button>
        </VStack>
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
        <VStack spacing={6} align="stretch" mb={8}>
          {historyFields.map((field, index) => (
            <Box
              key={field.id}
              p={4}
              bg="gray.50"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="600" color="gray.700">
                  History {index + 1}
                </Text>
                {index > 0 && (
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeHistory(index)}>
                    Remove
                  </Button>
                )}
              </Flex>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  Name of the medical condition
                </FormLabel>
                <Input
                  placeholder="Enter name of medical condition"
                  {...inputStyles}
                  {...register(`medicalHistory.${index}.conditionName`)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  Start and end date of medical condition
                </FormLabel>
                <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
                  <Input
                    type='date'
                    placeholder="Select start date"
                    flex="1"
                    minW="140px"
                    {...inputStyles}
                    {...register(`medicalHistory.${index}.startDate`)}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`medicalHistory.${index}.startDate`, 'Unknown')}
                  >
                    Unknown
                  </Button>
                </Flex>
                <Flex gap={3} flexWrap="wrap" align="center">
                  <Input
                    type='date'
                    placeholder="Select end date"
                    flex="1"
                    minW="140px"
                    {...inputStyles}
                    {...register(`medicalHistory.${index}.endDate`)}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`medicalHistory.${index}.endDate`, 'Unknown')}
                  >
                    Unknown
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`medicalHistory.${index}.endDate`, 'Ongoing')}
                  >
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
                  {...register(`medicalHistory.${index}.info`)}
                />
              </FormControl>
            </Box>
          ))}
          <Button
            variant="ghost"
            size="sm"
            color="#CE0037"
            leftIcon={<HiPlus />}
            onClick={() => appendHistory({ conditionName: '' })}
            alignSelf="flex-start"
          >
            Add another condition
          </Button>
        </VStack>
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
        <VStack spacing={6} align="stretch" mb={8}>
          {labTestFields.map((field, index) => (
            <Box
              key={field.id}
              p={4}
              bg="gray.50"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="600" color="gray.700">
                  Test {index + 1}
                </Text>
                {index > 0 && (
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeLabTest(index)}>
                    Remove
                  </Button>
                )}
              </Flex>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  Name of test
                </FormLabel>
                <Input
                  placeholder="Enter test name"
                  {...inputStyles}
                  {...register(`labTests.${index}.testName`)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  Test result (qualifier/value)
                </FormLabel>
                <Flex gap={3} flexWrap="wrap">
                  <Select
                    placeholder="None"
                    flex="1"
                    {...inputStyles}
                    {...register(`labTests.${index}.testQualifier`)}
                  >
                    <option value="none">None</option>
                    <option value="greater-than">&gt;</option>
                    <option value="greater-than-equal">&gt;=</option>
                    <option value="less-than">&lt;</option>
                    <option value="less-than-equal">&lt;=</option>
                    <option value="equal">=</option>
                    <option value="unknown">Unknown</option>
                  </Select>

                  <Input
                    placeholder="Enter value"
                    flex="1"
                    minW="140px"
                    {...inputStyles}
                    {...register(`labTests.${index}.testValue`)}
                  />
                </Flex>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  Outcome of test
                </FormLabel>
                <CheckboxGroup
                  colorScheme="red"
                  onChange={(val) => setValue(`labTests.${index}.outcome`, val)}
                >
                  <Stack direction="row" spacing={6} flexWrap="wrap">
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
                  {...register(`labTests.${index}.testComments`)}
                />
              </FormControl>
            </Box>
          ))}
          <Button
            variant="ghost"
            size="sm"
            color="#CE0037"
            leftIcon={<HiPlus />}
            onClick={() => appendLabTest({ testName: '' })}
            alignSelf="flex-start"
          >
            Add another test result
          </Button>
        </VStack>
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
