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
import { useTranslation } from 'react-i18next';
import { HiPlus } from 'react-icons/hi2';
import { ProductImageUpload } from '../../../shared/components/ProductImageUpload';

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
  const { t } = useTranslation();
  const { setValue, register, control, watch } = useFormContext();

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
        {t('forms.patient.additionalDetails.title')}
      </Heading>

      <ProductImageUpload
        label={t('forms.patient.additionalDetails.attachmentsLabel')}
        onChange={(base64Array) => setValue('attachments', base64Array)}
      />

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.additionalDetails.otherMedsLabel')}
        </FormLabel>
        <RadioGroup
          value={watch('takingOtherMeds') || takingOtherMeds}
          onChange={(val) => {
            setTakingOtherMeds(val);
            setValue('takingOtherMeds', val);
          }}
        >
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
                  {t('forms.patient.additionalDetails.medicationIndex', { index: index + 1 })}
                </Text>
                {index > 0 && (
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeOtherMed(index)}>
                    {t('forms.patient.common.remove')}
                  </Button>
                )}
              </Flex>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.productDetails.productNameLabel')}
                </FormLabel>
                <Input
                  placeholder={t('forms.patient.productDetails.productNamePlaceholder')}
                  {...inputStyles}
                  {...register(`otherMedications.${index}.product`)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.productDetails.conditionLabel')}
                </FormLabel>
                <Input
                  placeholder={t('forms.patient.productDetails.conditionPlaceholder')}
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
                    {t('forms.patient.common.unknown')}
                  </Button>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.historyDatesLabel')}
                </FormLabel>
                <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
                  <Input
                    type={watch(`otherMedications.${index}.startDate`) === 'Unknown' ? 'text' : 'date'}
                    placeholder={t('forms.patient.productDetails.startDatePlaceholder')}
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
                    {t('forms.patient.common.unknown')}
                  </Button>
                </Flex>
                <Flex gap={3} flexWrap="wrap" align="center">
                  <Input
                    type={['Unknown', 'Ongoing'].includes(watch(`otherMedications.${index}.endDate`)) ? 'text' : 'date'}
                    placeholder={t('forms.patient.productDetails.endDatePlaceholder')}
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
                    {t('forms.patient.common.unknown')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`otherMedications.${index}.endDate`, 'Ongoing')}
                  >
                    {t('forms.patient.common.ongoing')}
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
            {t('forms.patient.additionalDetails.addAnotherMed')}
          </Button>
        </VStack>
      )}

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.additionalDetails.medicalHistoryLabel')}
        </FormLabel>
        <RadioGroup
          value={watch('hasRelevantHistory') || hasRelevantHistory}
          onChange={(val) => {
            setHasRelevantHistory(val);
            setValue('hasRelevantHistory', val);
          }}
        >
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
                  {t('forms.patient.additionalDetails.historyIndex', { index: index + 1 })}
                </Text>
                {index > 0 && (
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeHistory(index)}>
                    Remove
                  </Button>
                )}
              </Flex>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.conditionNameLabel')}
                </FormLabel>
                <Input
                  placeholder={t('forms.patient.additionalDetails.conditionNamePlaceholder')}
                  {...inputStyles}
                  {...register(`medicalHistory.${index}.conditionName`)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.historyDatesLabel')}
                </FormLabel>
                <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
                  <Input
                    type={watch(`medicalHistory.${index}.startDate`) === 'Unknown' ? 'text' : 'date'}
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
                    {t('forms.patient.common.unknown')}
                  </Button>
                </Flex>
                <Flex gap={3} flexWrap="wrap" align="center">
                  <Input
                    type={['Unknown', 'Ongoing'].includes(watch(`medicalHistory.${index}.endDate`)) ? 'text' : 'date'}
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
                    {t('forms.patient.common.unknown')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    borderColor="gray.300"
                    onClick={() => setValue(`medicalHistory.${index}.endDate`, 'Ongoing')}
                  >
                    {t('forms.patient.common.ongoing')}
                  </Button>
                </Flex>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.historyInfoLabel')}
                </FormLabel>
                <Textarea
                  placeholder={t('forms.patient.additionalDetails.historyInfoPlaceholder')}
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
            {t('forms.patient.additionalDetails.addAnotherCondition')}
          </Button>
        </VStack>
      )}

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.additionalDetails.labTestsLabel')}
        </FormLabel>
        <RadioGroup
          value={watch('labTestsPerformed') || labTestsPerformed}
          onChange={(val) => {
            setLabTestsPerformed(val);
            setValue('labTestsPerformed', val);
          }}
        >
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
                  {t('forms.patient.additionalDetails.testIndex', { index: index + 1 })}
                </Text>
                {index > 0 && (
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeLabTest(index)}>
                    {t('forms.patient.common.remove')}
                  </Button>
                )}
              </Flex>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.testNameLabel')}
                </FormLabel>
                <Input
                  placeholder={t('forms.patient.additionalDetails.testNamePlaceholder')}
                  {...inputStyles}
                  {...register(`labTests.${index}.testName`)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.testResultLabel')}
                </FormLabel>
                <Flex gap={3} flexWrap="wrap">
                  <Select
                    placeholder={t('forms.patient.common.none')}
                    flex="1"
                    {...inputStyles}
                    {...register(`labTests.${index}.testQualifier`)}
                  >
                    <option value="none">{t('forms.patient.common.none')}</option>
                    <option value="greater-than">&gt;</option>
                    <option value="greater-than-equal">&gt;=</option>
                    <option value="less-than">&lt;</option>
                    <option value="less-than-equal">&lt;=</option>
                    <option value="equal">=</option>
                    <option value="unknown">{t('forms.patient.common.unknown')}</option>
                  </Select>

                  <Input
                    placeholder={t('forms.patient.additionalDetails.testValuePlaceholder')}
                    flex="1"
                    minW="140px"
                    {...inputStyles}
                    {...register(`labTests.${index}.testValue`)}
                  />
                </Flex>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.testOutcomeLabel')}
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
                  {t('forms.patient.additionalDetails.testCommentsLabel')}
                </FormLabel>
                <Textarea
                  placeholder={t('forms.patient.additionalDetails.anythingElsePlaceholder')}
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
            {t('forms.patient.additionalDetails.addAnotherTest')}
          </Button>
        </VStack>
      )}

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.additionalDetails.anythingElseLabel')}
        </FormLabel>
        <Textarea
          placeholder={t('forms.patient.additionalDetails.anythingElsePlaceholder')}
          rows={5}
          maxLength={10000}
          value={watch('additionalDetails') ?? additionalDetails}
          onChange={(e) => {
            setAdditionalDetails(e.target.value);
            setValue('additionalDetails', e.target.value);
          }}
          {...inputStyles}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          {additionalDetails.length}/10000
        </Text>
      </FormControl>
    </>
  );
}
