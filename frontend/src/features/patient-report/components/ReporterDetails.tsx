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
} from '@chakra-ui/react';



interface ReporterDetailsProps {
  inputStyles: any;
  contactPermission: string;
  setContactPermission: (val: string) => void;
  hcpContactPermission: string;
  setHcpContactPermission: (val: string) => void;
}

export function ReporterDetails({
  inputStyles,
  contactPermission,
  setContactPermission,
  hcpContactPermission,
  setHcpContactPermission,
}: ReporterDetailsProps) {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Enter your information
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Please enter your details
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      <FormControl mb={4}>
        <FormLabel fontWeight="500" color="gray.700">
          First name
        </FormLabel>
        <Input placeholder="Enter first name" {...inputStyles} />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel fontWeight="500" color="gray.700">
          Last name
        </FormLabel>
        <Input placeholder="Enter last name" {...inputStyles} />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Relationship to patient
        </FormLabel>
        <Input placeholder="Enter relationship to patient" {...inputStyles} />
      </FormControl>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          Do we have permission to contact you?
        </FormLabel>
        <RadioGroup value={contactPermission} onChange={setContactPermission}>
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

      {contactPermission === 'yes' && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            Your contact information
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              * Email address
            </FormLabel>
            <Input placeholder="client@gmail.com" type="email" {...inputStyles} />
          </FormControl>
          <FormControl>
            <FormLabel fontWeight="500" color="gray.700">
              Name
            </FormLabel>
            <Input placeholder="Enter your name" {...inputStyles} />
          </FormControl>
        </Box>
      )}

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Do we have permission to contact your Healthcare Professional (HCP) about this
          report?
        </FormLabel>
        <RadioGroup value={hcpContactPermission} onChange={setHcpContactPermission}>
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

      {hcpContactPermission === 'yes' && (
        <Box mb={8} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            HCP contact information
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              First name
            </FormLabel>
            <Input placeholder="Enter first name" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Last name
            </FormLabel>
            <Input placeholder="Enter last name" {...inputStyles} />
          </FormControl>
          <Text fontWeight="600" mb={3} color="gray.700" fontSize="sm">
            How do we contact them? (complete at least one of these fields)
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Email
            </FormLabel>
            <Input placeholder="Enter email address" type="email" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Phone number
            </FormLabel>
            <Input placeholder="Enter number including area code" type="tel" {...inputStyles} />
          </FormControl>
        </Box>
      )}

    </>
  );
}

