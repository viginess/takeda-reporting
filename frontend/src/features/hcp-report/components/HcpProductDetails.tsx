import {
  FormControl,
  FormLabel,
  Input,
  Flex,
  Button,
  Heading,
  Text,
  Box,
  Image,
  Select,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  IconButton,
  InputGroup,
  InputRightElement,
  Portal,
  VStack,
} from '@chakra-ui/react';
import { ProductImageUpload } from '../../../shared/components/ProductImageUpload';
import { HiQuestionMarkCircle, HiPlus } from 'react-icons/hi2';
import { useFormContext, useFieldArray } from 'react-hook-form';
import batchImg from '../../../assets/batch.png';
import { useTranslation } from 'react-i18next';

interface HcpProductDetailsProps {
  inputStyles: any;
  index?: number;
  onAddProduct?: () => void;
}

export function HcpProductDetails({ inputStyles, index = 0, onAddProduct }: HcpProductDetailsProps) {
  const { t } = useTranslation();
  const { setValue, register, control, watch } = useFormContext();

  const { fields: conditionFields, append: appendCondition, remove: removeCondition } = useFieldArray({
    control,
    name: `products.${index}.conditions`,
  });

  const { fields: batchFields, append: appendBatch, remove: removeBatch } = useFieldArray({
    control,
    name: `products.${index}.batches`,
  });

  // Initialize batch array if empty
  if (batchFields.length === 0) {
    appendBatch({ batchNumber: '', expiryDate: '', startDate: '', endDate: '', dosage: '' });
  }

  // Initialize field arrays if empty
  if (conditionFields.length === 0) {
    // This is a bit risky in render, but react-hook-form handles it
    // Actually better to use useEffect or defaultValues in HcpForm
  }




  const prefix = `products.${index}`;

  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.patient.productDetails.title')}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={6}>
        {t('forms.patient.productDetails.subtitle')}
      </Text>

      <FormControl mb={6} isRequired>
        <Input
          placeholder={t('forms.patient.productDetails.productNamePlaceholder')}
          {...inputStyles}
          {...register(`${prefix}.productName`, { required: t('forms.patient.productDetails.productNameRequired') })}
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.productDetails.conditionLabel')}
        </FormLabel>
        <VStack align="stretch" spacing={3}>
          {conditionFields.map((field, cIdx) => (
            <Flex key={field.id} gap={3} flexWrap="wrap">
              <Input
                placeholder={t('forms.patient.productDetails.conditionPlaceholder')}
                flex="1"
                minW="200px"
                {...inputStyles}
                {...register(`${prefix}.conditions.${cIdx}.name`)}
              />
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.conditions.${cIdx}.name`, 'Unknown')}
              >
                {t('forms.patient.common.unknown')}
              </Button>
              {cIdx > 0 && (
                <Button variant="ghost" colorScheme="red" size="lg" onClick={() => removeCondition(cIdx)}>
                  {t('forms.patient.common.remove')}
                </Button>
              )}
            </Flex>
          ))}
        </VStack>
        <Button
          variant="ghost"
          size="sm"
          mt={2}
          color="#CE0037"
          leftIcon={<HiPlus />}
          onClick={() => appendCondition({ name: '' })}
        >
          {t('forms.patient.productDetails.addCondition')}
        </Button>
      </FormControl>

      <Box mt={10} mb={6}>
        <Text fontWeight="600" color="gray.700">
          {t('forms.patient.productDetails.batchTitle')}
        </Text>
        <Box borderBottom="2px solid" borderColor="#CE0037" mt={2} mb={6} w="full" maxW="200px" />
      </Box>

      {batchFields.map((field, bIdx) => (
        <Box key={field.id} p={4} border="1px solid" borderColor="gray.100" borderRadius="lg" mb={6}>
          {bIdx > 0 && (
            <Flex justify="flex-end" mb={2}>
              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeBatch(bIdx)}>
                {t('forms.patient.productDetails.removeBatch')}
              </Button>
            </Flex>
          )}
          <FormControl mb={6} isRequired>
            <FormLabel fontWeight="500" color="gray.700" mb={2}>
              {t('forms.patient.productDetails.batchLotNumberLabel')}
            </FormLabel>
            <Flex gap={3} flexWrap="wrap">
              <InputGroup flex="1" minW="200px">
                <Input
                  placeholder={t('forms.patient.productDetails.batchNumberPlaceholder')}
                  {...inputStyles}
                  pr="40px"
                  {...register(`${prefix}.batches.${bIdx}.batchNumber`, { required: t('forms.patient.productDetails.batchNumberRequired') })}
                />
                <InputRightElement height="100%" width="40px">
                  <Popover placement="right" trigger="click">
                    <PopoverTrigger>
                      <IconButton
                        aria-label="Help with batch number"
                        icon={<HiQuestionMarkCircle size="20px" />}
                        variant="ghost"
                        size="sm"
                        color="gray.500"
                        _hover={{ color: 'gray.700', bg: 'transparent' }}
                      />
                    </PopoverTrigger>
                    <Portal>
                      <PopoverContent width="400px" shadow="lg">
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader fontWeight="600" fontSize="md" pb={3}>
                          {t('forms.hcp.productDetails.batchNumberHelp')}
                        </PopoverHeader>
                        <PopoverBody p={4}>
                          <Box
                            borderRadius="md"
                            overflow="hidden"
                            bg="gray.50"
                            border="1px solid"
                            borderColor="gray.200"
                            mb={3}
                          >
                            <Image
                              src={batchImg}
                              alt={t('forms.hcp.productDetails.batchNumberFind')}
                              w="full"
                              h="auto"
                              objectFit="cover"
                              loading="lazy"
                            />
                          </Box>
                          <Text fontSize="sm" color="gray.600">
                            {t('forms.hcp.productDetails.batchNumberFind')}
                          </Text>
                        </PopoverBody>
                      </PopoverContent>
                    </Portal>
                  </Popover>
                </InputRightElement>
              </InputGroup>
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.batches.${bIdx}.batchNumber`, 'Unknown')}
              >
                {t('forms.patient.common.unknown')}
              </Button>
            </Flex>
             <Text fontSize="xs" color="gray.500" mt={2}>
                      {t('forms.hcp.productDetails.batchNumberDetails')}
                    </Text>
          </FormControl>

          <FormControl mb={6}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.productDetails.expiryDateLabel')}
            </FormLabel>
            <Flex gap={3} flexWrap="wrap">
              <Input
                type={watch(`${prefix}.batches.${bIdx}.expiryDate`) === 'Unknown' ? 'text' : 'date'}
                placeholder={t('forms.patient.productDetails.expiryDatePlaceholder')}
                flex="1"
                minW="200px"
                {...inputStyles}
                {...register(`${prefix}.batches.${bIdx}.expiryDate`)}
              />
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.batches.${bIdx}.expiryDate`, 'Unknown')}
              >
                {t('forms.patient.common.unknown')}
              </Button>
            </Flex>
          </FormControl>

          <FormControl mb={6}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.productDetails.startDateStop')}
            </FormLabel>
            <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
              <Input
                type={watch(`${prefix}.batches.${bIdx}.startDate`) === 'Unknown' ? 'text' : 'date'}
                placeholder={t('forms.patient.productDetails.startDatePlaceholder')}
                flex="1"
                minW="140px"
                {...inputStyles}
                {...register(`${prefix}.batches.${bIdx}.startDate`)}
              />
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.batches.${bIdx}.startDate`, 'Unknown')}
              >
                {t('forms.patient.common.unknown')}
              </Button>
            </Flex>
            <Flex gap={3} flexWrap="wrap" align="center">
              <Input
                type={['Unknown', 'Ongoing'].includes(watch(`${prefix}.batches.${bIdx}.endDate`)) ? 'text' : 'date'}
                placeholder={t('forms.patient.productDetails.endDatePlaceholder')}
                flex="1"
                minW="140px"
                {...inputStyles}
                {...register(`${prefix}.batches.${bIdx}.endDate`)}
              />
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.batches.${bIdx}.endDate`, 'Unknown')}
              >
                {t('forms.patient.common.unknown')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.batches.${bIdx}.endDate`, 'Ongoing')}
              >
                {t('forms.patient.common.ongoing')}
              </Button>
            </Flex>
          </FormControl>
            <Flex gap={6} mb={6} flexWrap="wrap">
        <FormControl flex="1" minW="250px">
          <FormLabel fontWeight="500" color="gray.700">
            {t('forms.hcp.productDetails.doseFormLabel')}
          </FormLabel>
          <Select placeholder={t('forms.patient.common.selectOption')} {...inputStyles} {...register(`${prefix}.doseForm`)}>
            <option value="tablet">{t('forms.hcp.productDetails.doseForms.tablet')}</option>
            <option value="capsule">{t('forms.hcp.productDetails.doseForms.capsule')}</option>
            <option value="injection">{t('forms.hcp.productDetails.doseForms.injection')}</option>
            <option value="cream">{t('forms.hcp.productDetails.doseForms.cream')}</option>
            <option value="syrup">{t('forms.hcp.productDetails.doseForms.syrup')}</option>
            <option value="other">{t('forms.hcp.productDetails.doseForms.other')}</option>
          </Select>
        </FormControl>

        <FormControl flex="1" minW="250px">
          <FormLabel fontWeight="500" color="gray.700">
            {t('forms.hcp.productDetails.routeLabel')}
          </FormLabel>
          <Select placeholder={t('forms.patient.common.selectOption')} {...inputStyles} {...register(`${prefix}.route`)}>
            <option value="oral">{t('forms.hcp.productDetails.routes.oral')}</option>
            <option value="sublingual">{t('forms.hcp.productDetails.routes.sublingual')}</option>
            <option value="inhaled">{t('forms.hcp.productDetails.routes.inhaled')}</option>
            <option value="intramuscular">{t('forms.hcp.productDetails.routes.intramuscular')}</option>
            <option value="intravenous">{t('forms.hcp.productDetails.routes.intravenous')}</option>
            <option value="iv-infusion">{t('forms.hcp.productDetails.routes.iv-infusion')}</option>
            <option value="subcutaneous">{t('forms.hcp.productDetails.routes.subcutaneous')}</option>
            <option value="intradermal">{t('forms.hcp.productDetails.routes.intradermal')}</option>
            <option value="infusion">{t('forms.hcp.productDetails.routes.infusion')}</option>
            <option value="topical">{t('forms.hcp.productDetails.routes.topical')}</option>
            <option value="eye-drops">{t('forms.hcp.productDetails.routes.eye-drops')}</option>
            <option value="eye-cream">{t('forms.hcp.productDetails.routes.eye-cream')}</option>
            <option value="ear-drop">{t('forms.hcp.productDetails.routes.ear-drop')}</option>
            <option value="rectal">{t('forms.hcp.productDetails.routes.rectal')}</option>
            <option value="vaginal">{t('forms.hcp.productDetails.routes.vaginal')}</option>
            <option value="implant">{t('forms.hcp.productDetails.routes.implant')}</option>
            <option value="other">{t('forms.hcp.productDetails.routes.other')}</option>
            <option value="unknown">{t('forms.hcp.productDetails.routes.unknown')}</option>
          </Select>
        </FormControl>
      </Flex>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.productDetails.dosageLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.patient.productDetails.dosagePlaceholder')}
          {...inputStyles}
          {...register(`${prefix}.dosage`)}
        />
      </FormControl>

      <ProductImageUpload />
        </Box>
      ))}

      <Button
        variant="ghost"
        size="sm"
        mb={8}
        color="#CE0037"
        leftIcon={<HiPlus />}
        onClick={() => appendBatch({ batchNumber: '', expiryDate: '', startDate: '', endDate: '' })}
      >
        {t('forms.patient.productDetails.addBatch')}
      </Button>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.productDetails.actionTakenLabel')}
        </FormLabel>
        <Select placeholder={t('forms.patient.common.selectOption')} {...inputStyles} {...register(`${prefix}.actionTaken`)}>
          <option value="no-change">{t('forms.hcp.productDetails.actions.no-change')}</option>
          <option value="dose-decreased">{t('forms.hcp.productDetails.actions.dose-decreased')}</option>
          <option value="dose-increased">{t('forms.hcp.productDetails.actions.dose-increased')}</option>
          <option value="withdrawn">{t('forms.hcp.productDetails.actions.withdrawn')}</option>
          <option value="unknown">{t('forms.hcp.productDetails.actions.unknown')}</option>
          <option value="not-applicable">{t('forms.hcp.productDetails.actions.not-applicable')}</option>
          <option value="suspended-interrupted">{t('forms.hcp.productDetails.actions.suspended-interrupted')}</option>
        </Select>
      </FormControl>

      {onAddProduct && (
        <Button
          mb={4}
          width="full"
          bg="#CE0037"
          color="white"
          fontWeight={600}
          borderRadius="lg"
          size="lg"
          _hover={{ bg: '#E31C5F' }}
          leftIcon={<HiPlus />}
          onClick={onAddProduct}
        >
          {t('forms.patient.productDetails.anotherProduct')}
        </Button>
      )}
    </>
  );
}
