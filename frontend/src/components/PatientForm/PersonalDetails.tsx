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
} from '@chakra-ui/react';

interface PersonalDetailsProps {
  inputStyles: any;
  ageType: 'dob' | 'age' | '';
  setAgeType: (val: 'dob' | 'age' | '') => void;
  contactPermission: string;
  setContactPermission: (val: string) => void;
  hcpContactPermission: string;
  setHcpContactPermission: (val: string) => void;
}

export function PersonalDetails({
  inputStyles,
  ageType,
  setAgeType,
  contactPermission,
  setContactPermission,
  hcpContactPermission,
  setHcpContactPermission,
}: PersonalDetailsProps) {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Now, a little about you.
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={2}>
        * Your details (complete at least one of the fields)
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Initials
        </FormLabel>
        <Input placeholder="Enter your initials" {...inputStyles} mb={2} />
        <Button variant="ghost" size="sm" color="gray.600">
          Prefer not to provide
        </Button>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Age (Select one)
        </FormLabel>
        <RadioGroup value={ageType} onChange={(val) => setAgeType(val as 'dob' | 'age' | '')}>
          <Stack spacing={2}>
            <Radio value="dob" colorScheme="red">
              Date of birth
            </Radio>
            <Radio value="age" colorScheme="red">
              Age
            </Radio>
          </Stack>
        </RadioGroup>
        {ageType === 'dob' && (
          <Input
            placeholder="Select date of birth"
            type="date"
            mt={3}
            {...inputStyles}
          />
        )}
        {ageType === 'age' && (
          <Flex gap={3} mt={3} align="center">
            <Input
              placeholder="32"
              type="number"
              flex="1"
              maxW="120px"
              {...inputStyles}
            />
            <Text color="gray.600">Years</Text>
          </Flex>
        )}
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Sex assigned at birth
        </FormLabel>
        <RadioGroup defaultValue="">
          <Stack direction="row" spacing={6}>
            <Radio value="male" colorScheme="red">
              Male
            </Radio>
            <Radio value="female" colorScheme="red">
              Female
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          * Do we have permission to contact you?
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
          <Text fontWeight="600" mb={3} color="gray.700" fontSize="sm">
            Healthcare professional additional contact details
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Hospital/Institution
            </FormLabel>
            <Input placeholder="Enter hospital/institution" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Address
            </FormLabel>
            <Input placeholder="Enter address" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              City/Town
            </FormLabel>
            <Input placeholder="Enter city/town" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              State/County/Province
            </FormLabel>
            <Input placeholder="Enter state/county/province" {...inputStyles} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              ZIP/Postal code
            </FormLabel>
            <Input placeholder="Enter ZIP/Postal code" {...inputStyles} />
          </FormControl>
          <FormControl>
            <FormLabel fontWeight="500" color="gray.700">
              * Country
            </FormLabel>
            <Input placeholder="Enter country" {...inputStyles} />
          </FormControl>
        </Box>
      )}
    </>
  );
}
