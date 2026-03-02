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
import { ProductImageUpload } from '../../../shared/components/ProductImageUpload';
import { useTranslation } from 'react-i18next';

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
        {t('forms.hcp.additionalDetails.title')}
      </Heading>

      <ProductImageUpload
        label={t('forms.hcp.additionalDetails.attachmentsQuestion')}
        onChange={(base64Array) => setValue('attachments', base64Array)}
      />

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.additionalDetails.otherMedsQuestion')}
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
              {t('forms.patient.common.yes')}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t('forms.patient.common.no')}
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
                  {t('forms.patient.additionalDetails.productLabel')}
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
                  {t('forms.hcp.productDetails.startDateStop')}
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
            {t('forms.patient.additionalDetails.addMedication')}
          </Button>
        </VStack>
      )}

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.additionalDetails.medicalHistoryQuestion')}
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
              {t('forms.patient.common.yes')}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t('forms.patient.common.no')}
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
                    {t('forms.patient.common.remove')}
                  </Button>
                )}
              </Flex>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                   {t('forms.patient.additionalDetails.medicalHistoryLabel')}
                </FormLabel>
                <Input
                  placeholder={t('forms.patient.additionalDetails.historyPlaceholder')}
                  {...inputStyles}
                  {...register(`medicalHistory.${index}.conditionName`)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.hcp.productDetails.startDateStop')}
                </FormLabel>
                <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
                  <Input
                    type={watch(`medicalHistory.${index}.startDate`) === 'Unknown' ? 'text' : 'date'}
                    placeholder={t('forms.patient.productDetails.startDatePlaceholder')}
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
                    placeholder={t('forms.patient.productDetails.endDatePlaceholder')}
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
            {t('forms.patient.additionalDetails.addCondition')}
          </Button>
        </VStack>
      )}

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.additionalDetails.labTestsQuestion')}
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
              {t('forms.patient.common.yes')}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t('forms.patient.common.no')}
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
                  {t('forms.patient.additionalDetails.labTestsLabel')}
                </FormLabel>
                <Input
                  placeholder={t('forms.patient.additionalDetails.testPlaceholder')}
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
                    <Checkbox value="positive">{t('forms.patient.additionalDetails.testOutcomes.positive')}</Checkbox>
                    <Checkbox value="negative">{t('forms.patient.additionalDetails.testOutcomes.negative')}</Checkbox>
                    <Checkbox value="borderline">{t('forms.patient.additionalDetails.testOutcomes.borderline')}</Checkbox>
                    <Checkbox value="inconclusive">{t('forms.patient.additionalDetails.testOutcomes.inconclusive')}</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontWeight="500" color="gray.700">
                  {t('forms.patient.additionalDetails.testCommentsLabel')}
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
            {t('forms.patient.additionalDetails.addTest')}
          </Button>
        </VStack>
      )}

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.additionalDetails.anythingElseQuestion')}
        </FormLabel>
        <Textarea
          placeholder={t('forms.hcp.additionalDetails.anythingElsePlaceholder')}
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
