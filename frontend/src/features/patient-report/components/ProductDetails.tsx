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
import { HiQuestionMarkCircle, HiPlus } from 'react-icons/hi2';
import { useFormContext, useFieldArray } from 'react-hook-form';
import batchImg from '../../../assets/batch.png';

interface ProductDetailsProps {
  inputStyles: any;
  index?: number;
  onAddProduct?: () => void;
}

export function ProductDetails({ inputStyles, index = 0, onAddProduct }: ProductDetailsProps) {
  const { setValue, register, control } = useFormContext();

  const { fields: conditionFields, append: appendCondition, remove: removeCondition } = useFieldArray({
    control,
    name: `products.${index}.conditions`,
  });

  const { fields: batchFields, append: appendBatch, remove: removeBatch } = useFieldArray({
    control,
    name: `products.${index}.batches`,
  });

  const prefix = `products.${index}`;




  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Let&apos;s get some product details
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={6}>
        For which product do you want to report a potential concern?
      </Text>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          Enter product name
        </FormLabel>
        <Input
          placeholder="Enter product name"
          {...inputStyles}
          {...register(`${prefix}.productName`, { required: 'Product name is required' })}
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          What condition are you treating?
        </FormLabel>
        <VStack align="stretch" spacing={3}>
          {conditionFields.map((field, cIdx) => (
            <Flex key={field.id} gap={3} flexWrap="wrap">
              <Input
                placeholder="Enter condition name"
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
                Unknown
              </Button>
              {cIdx > 0 && (
                <Button variant="ghost" colorScheme="red" size="lg" onClick={() => removeCondition(cIdx)}>
                  Remove
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
          Add condition
        </Button>
      </FormControl>

      <Heading as="h3" size="md" mt={8} mb={4} color="gray.800" fontWeight="600">
        Please enter the following product information
      </Heading>

      {batchFields.map((field, bIdx) => (
        <Box key={field.id} p={4} border="1px solid" borderColor="gray.100" borderRadius="lg" mb={6}>
          {bIdx > 0 && (
            <Flex justify="flex-end" mb={2}>
              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeBatch(bIdx)}>
                Remove batch
              </Button>
            </Flex>
          )}
          <FormControl mb={6} isRequired>
            <FormLabel fontWeight="500" color="gray.700" mb={2}>
              Batch / lot number
            </FormLabel>
            <Flex gap={3} flexWrap="wrap">
              <InputGroup flex="1" minW="200px">
                <Input
                  placeholder="Enter batch number"
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
                          Where to find the batch number
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
                            Look for the batch/lot number on the packaging, typically found near the
                            expiry date or barcode.
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
                Unknown
              </Button>
            </Flex>
             <Text fontSize="xs" color="gray.500" mt={2}>
          The batch or lot number and expiry date are usually printed on the outer carton or
          container, often inside a black rectangle or near the barcode. On some packs,
          they may appear as plain text or beside a QR code.
        </Text>
          </FormControl>

          <FormControl mb={6}>
            <FormLabel fontWeight="500" color="gray.700">
              Expiry date
            </FormLabel>
            <Flex gap={3} flexWrap="wrap">
              <Input
               type='date'
                placeholder="e.g. 24 February 2020"
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
                Unknown
              </Button>
            </Flex>
          </FormControl>

          <FormControl mb={6}>
            <FormLabel fontWeight="500" color="gray.700">
              When did you start/stop using this batch?
            </FormLabel>
            <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
              <Input
              type='date'
                placeholder="Select start date"
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
                {...register(`${prefix}.batches.${bIdx}.endDate`)}
              />
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.batches.${bIdx}.endDate`, 'Unknown')}
              >
                Unknown
              </Button>
              <Button
                variant="outline"
                size="lg"
                borderColor="gray.300"
                onClick={() => setValue(`${prefix}.batches.${bIdx}.endDate`, 'Ongoing')}
              >
                Ongoing
              </Button>
            </Flex>
          </FormControl>

          <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Dosage
        </FormLabel>
        <Input
          placeholder="Enter dose (e.g. 30mg per day)"
          {...inputStyles}
          {...register(`${prefix}.dosage`)}
        />
      </FormControl>

        <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Can you take a photo of the product packaging, including batch / lot number information?
        </FormLabel>
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="lg"
          p={8}
          textAlign="center"
          bg="gray.50"
          _hover={{ borderColor: 'gray.400', bg: 'gray.50' }}
        >
          <Text fontSize="sm" color="gray.500" mb={2}>
            Max files: 3 · Max size per file: 15MB
          </Text>
          <Button variant="outline" size="lg">
            Upload
          </Button>
        </Box>
      </FormControl>
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
        Add product batch
      </Button>

      

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          What was the action taken for the drug due to the event?
        </FormLabel>
        <Select placeholder="Select option" {...inputStyles} {...register(`${prefix}.actionTaken`)}>
          <option value="continued">Continued</option>
          <option value="stopped">Stopped</option>
          <option value="dose-reduced">Dose reduced</option>
          <option value="other">Other</option>
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
          Add another product
        </Button>
      )}
    </>
  );
}
