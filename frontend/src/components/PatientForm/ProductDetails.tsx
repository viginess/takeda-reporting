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
} from '@chakra-ui/react';
import batch from '../../assets/batch.png';

interface ProductDetailsProps {
  inputStyles: any;
}

export function ProductDetails({ inputStyles }: ProductDetailsProps) {
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
        <Input placeholder="Enter product name" {...inputStyles} />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          What condition are you treating?
        </FormLabel>
        <Flex gap={3} flexWrap="wrap">
          <Input
            placeholder="Enter condition name"
            flex="1"
            minW="200px"
            {...inputStyles}
          />
          <Button variant="outline" size="lg" borderColor="gray.300">
            Unknown
          </Button>
          <Button variant="outline" size="lg" borderColor="gray.300">
            + Add condition
          </Button>
        </Flex>
      </FormControl>

      <Heading as="h3" size="md" mt={8} mb={4} color="gray.800" fontWeight="600">
        Please enter the following product information
      </Heading>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          Batch / lot number
        </FormLabel>
        <Flex gap={3} flexWrap="wrap">
          <Input placeholder="Enter batch number" flex="1" minW="200px" {...inputStyles} />
          <Button variant="outline" size="lg" borderColor="gray.300">
            Unknown
          </Button>
        </Flex>
        <Text fontSize="xs" color="gray.500" mt={2}>
          The batch or lot number and expiry date are usually printed on the outer carton or
          container, often inside a black rectangle or near the barcode. On some packs,
          they may appear as plain text or beside a QR code.
        </Text>
        <Box
          mt={3}
          p={4}
          bg="white"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Image
            src={batch}
            alt="Example of where to find batch/lot number on packaging"
            w="full"
            maxW="400px"
            mx="auto"
            objectFit="contain"
          />
        </Box>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Expiry date
        </FormLabel>
        <Flex gap={3} flexWrap="wrap">
          <Input
            placeholder="e.g. 24 February 2020"
            flex="1"
            minW="200px"
            type="date"
            {...inputStyles}
          />
          <Button variant="outline" size="lg" borderColor="gray.300">
            Unknown
          </Button>
        </Flex>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          When did you start/stop using this batch?
        </FormLabel>
        <Flex gap={3} flexWrap="wrap" align="center">
          <Input
            placeholder="Select start date"
            flex="1"
            minW="140px"
            type="date"
            {...inputStyles}
          />
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

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Dosage
        </FormLabel>
        <Input placeholder="Enter dose (e.g. 30mg per day)" {...inputStyles} />
      </FormControl>

      <Button variant="outline" size="lg" mb={8} borderColor="gray.300" width="full">
        + Add product batch
      </Button>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          What was the action taken for the drug due to the event?
        </FormLabel>
        <Select placeholder="Select option" {...inputStyles}>
          <option value="continued">Continued</option>
          <option value="stopped">Stopped</option>
          <option value="dose-reduced">Dose reduced</option>
          <option value="other">Other</option>
        </Select>
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Can you take a photo of the product packaging, including batch / lot number
          information?
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

      <Button mb={4} width="full" bg="#CE0037" color="white" fontWeight={600} borderRadius="lg" size="lg" _hover={{ bg: '#E31C5F' }}>
        Add another product +
      </Button>
    </>
  );
}
