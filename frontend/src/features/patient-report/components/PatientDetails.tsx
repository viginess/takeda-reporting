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

interface PatientDetailsProps {
  inputStyles: any;
  ageType: 'dob' | 'age' | '';
  setAgeType: (val: 'dob' | 'age' | '') => void;
}

export function PatientDetails({
  inputStyles,
  ageType,
  setAgeType,
}: PatientDetailsProps) {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Enter patient information
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={2}>
        Patient details (complete at least one of the fields)
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Name or initials
        </FormLabel>
        <Input placeholder="Enter name or initials" {...inputStyles} mb={2} />
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

      <FormControl mb={8}>
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

    </>
  );
}

