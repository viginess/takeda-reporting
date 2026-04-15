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
  Badge,
} from '@chakra-ui/react';
import { ProductImageUpload } from '../../../shared/components/upload/ProductImageUpload';
import { DrugSearchInput } from '../../../shared/components/whodrug/DrugSearchInput';
import { HiQuestionMarkCircle, HiPlus } from 'react-icons/hi2';
import { useFormContext, useFieldArray } from 'react-hook-form';
import batchImg from '../../../assets/batch.png';
import { useTranslation } from 'react-i18next';

interface ProductDetailsProps {
  inputStyles: any;
  index?: number;
  onAddProduct?: () => void;
}

export function ProductDetails({ inputStyles, index = 0, onAddProduct }: ProductDetailsProps) {
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

  const prefix = `products.${index}`;




  // Initialize batch array if empty
  if (batchFields.length === 0) {
    appendBatch({ batchNumber: '', expiryDate: '', startDate: '', endDate: '', dosage: '' });
  }

  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.patient.productDetails.title')}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={6}>
        {t('forms.patient.productDetails.subtitle')}
      </Text>

      <FormControl mb={2} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.productDetails.productNameLabel')}
        </FormLabel>
        <DrugSearchInput
          value={watch(`${prefix}.productName`) || ''}
          onChange={(name, code) => {
            setValue(`${prefix}.productName`, name, { shouldValidate: true });
            if (code) {
              // User selected from dictionary — save the WHODrug code
              setValue(`${prefix}.whodrugCode`, code);
            } else {
              // User is typing free text — clear any previously saved code
              setValue(`${prefix}.whodrugCode`, '');
            }
          }}
          inputStyles={inputStyles}
        />
        {/* Visual indicator: shows green badge when a valid WHODrug code is saved */}
        {watch(`${prefix}.whodrugCode`) ? (
          <Flex align="center" mt={2} gap={2}>
            <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="full">
              WHODrug Coded: {watch(`${prefix}.whodrugCode`)}
            </Badge>
            <Text fontSize="xs" color="gray.500">Ingredient & ATC data will be auto-populated</Text>
          </Flex>
        ) : (
          <Text fontSize="xs" color="orange.500" mt={1}>
            Select from suggestions to enable regulatory coding
          </Text>
        )}
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.productDetails.conditionLabel')}
        </FormLabel>
        <VStack align="stretch" spacing={3}>
          {conditionFields.map((field, cIdx) => (
            <Flex key={field.id} gap={3} flexWrap="wrap">
              <Input
                placeholder={t('forms.patient.productDetails.conditionPlaceholder', 'e.g. Headache, Back pain')}
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
                <Button variant="ghost" colorScheme="blue" size="lg" onClick={() => removeCondition(cIdx)}>
                  {t('common.remove')}
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

      <Heading as="h3" size="md" mt={8} mb={4} color="gray.800" fontWeight="600">
        {t('forms.patient.productDetails.productInfoTitle')}
      </Heading>

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
              {t('forms.patient.productDetails.batchLabel')}
            </FormLabel>
            <Flex gap={3} flexWrap="wrap">
              <InputGroup flex="1" minW="200px">
                <Input
                  placeholder={t('forms.patient.productDetails.batchPlaceholder')}
                  {...inputStyles}
                  pr="40px"
                  {...register(`${prefix}.batches.${bIdx}.batchNumber`)}
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
                          {t('forms.patient.productDetails.batchHelpTitle')}
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
                              alt="Example of where to find batch/lot number on packaging"
                              w="full"
                              h="auto"
                              objectFit="cover"
                              loading="lazy"
                            />
                          </Box>
                          <Text fontSize="sm" color="gray.600">
                            {t('forms.patient.productDetails.batchHelpBody')}
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
          {t('forms.patient.productDetails.batchHelpFooter')}
        </Text>
          </FormControl>

          <FormControl mb={6}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.productDetails.expiryLabel')}
            </FormLabel>
            <Flex gap={3} flexWrap="wrap">
              <Input
                key={watch(`${prefix}.batches.${bIdx}.expiryDate`) === 'Unknown' ? 'untouchable' : 'selectable'}
                type={watch(`${prefix}.batches.${bIdx}.expiryDate`) === 'Unknown' ? 'text' : 'date'}
                value={watch(`${prefix}.batches.${bIdx}.expiryDate`) === 'Unknown' ? t('forms.patient.common.unknown') : watch(`${prefix}.batches.${bIdx}.expiryDate`)}
                placeholder={t('forms.patient.productDetails.expiryPlaceholder')}
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
              {t('forms.patient.productDetails.dateRangeLabel')}
            </FormLabel>
            <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
              <Input
                key={watch(`${prefix}.batches.${bIdx}.startDate`) === 'Unknown' ? 'untouchable' : 'selectable'}
                type={watch(`${prefix}.batches.${bIdx}.startDate`) === 'Unknown' ? 'text' : 'date'}
                value={watch(`${prefix}.batches.${bIdx}.startDate`) === 'Unknown' ? t('forms.patient.common.unknown') : watch(`${prefix}.batches.${bIdx}.startDate`)}
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
                key={['Unknown', 'Ongoing'].includes(watch(`${prefix}.batches.${bIdx}.endDate`)) ? 'untouchable' : 'selectable'}
                type={['Unknown', 'Ongoing'].includes(watch(`${prefix}.batches.${bIdx}.endDate`)) ? 'text' : 'date'}
                value={watch(`${prefix}.batches.${bIdx}.endDate`) === 'Unknown' ? t('forms.patient.common.unknown') : watch(`${prefix}.batches.${bIdx}.endDate`) === 'Ongoing' ? t('forms.patient.common.ongoing') : watch(`${prefix}.batches.${bIdx}.endDate`)}
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

          <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.productDetails.dosageLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.patient.productDetails.dosagePlaceholder')}
          {...inputStyles}
          {...register(`${prefix}.dosage`)}
        />
      </FormControl>

      <ProductImageUpload
        label={t('forms.patient.additionalDetails.attachmentsLabel')}
        onChange={(base64Array) => setValue(`${prefix}.images`, base64Array)}
      />
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

      

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.productDetails.actionTakenLabel')}
        </FormLabel>
        <Select placeholder={t('forms.patient.productDetails.actionTakenPlaceholder')} {...inputStyles} {...register(`${prefix}.actionTaken`)}>
          <option value="continued">{t('forms.patient.productDetails.actions.continued')}</option>
          <option value="stopped">{t('forms.patient.productDetails.actions.stopped')}</option>
          <option value="dose-reduced">{t('forms.patient.productDetails.actions.doseReduced')}</option>
          <option value="other">{t('forms.patient.productDetails.actions.other')}</option>
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
          {t('forms.patient.productDetails.addAnother')}
        </Button>
      )}
    </>
  );
}
