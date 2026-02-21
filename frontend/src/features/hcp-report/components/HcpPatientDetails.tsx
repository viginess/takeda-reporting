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
import { useFormContext } from 'react-hook-form';

interface HcpPatientDetailsProps {
  inputStyles: any;
  ageType: 'dob' | 'age' | '';
  setAgeType: (val: 'dob' | 'age' | '') => void;
}

export function HcpPatientDetails({
  inputStyles,
  ageType,
  setAgeType,
}: HcpPatientDetailsProps) {
  const { setValue, register, watch } = useFormContext();

  const setUnknown = (fieldName: string) => {
    setValue(fieldName, 'Unknown');
  };

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
        <Input
          placeholder="Enter name or initials"
          {...inputStyles}
          mb={2}
          {...register('patientInitials')}
        />
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          onClick={() => setUnknown('patientInitials')}
        >
          Unknown
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
            type={watch('patientDob') === 'Unknown' ? 'text' : 'date'}
            placeholder="Select date of birth"
            mt={3}
            {...inputStyles}
            {...register('patientDob')}
          />
        )}
        {ageType === 'age' && (
          <Flex gap={3} mt={3} align="center">
            <Input
              placeholder="32"
              type={watch('patientAge') === 'Unknown' ? 'text' : 'number'}
              flex="1"
              maxW="120px"
              {...inputStyles}
              {...register('patientAge')}
            />
            <Text color="gray.600">Years</Text>
          </Flex>
        )}
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Sex assigned at birth
        </FormLabel>
        <RadioGroup 
          value={watch('patientGender') || ''} 
          onChange={(val) => setValue('patientGender', val)}
        >
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

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Patient ID or reference number (if known)
        </FormLabel>
        <Input
          placeholder="Enter Patient ID/reference number"
          {...inputStyles}
          {...register('patientReference')}
        />
      </FormControl>

      <Box mt={10} mb={6}>
        <Text fontWeight="600" color="gray.700">
          Additional patient details
        </Text>
        <Box borderBottom="2px solid" borderColor="#CE0037" mt={2} mb={6} w="full" maxW="200px" />
      </Box>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Height (centimetres or inches)
        </FormLabel>
        <Input
          placeholder="Enter height e.g. 175"
          {...inputStyles}
          {...register('patientHeight')}
        />
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Weight (kilograms or pounds)
        </FormLabel>
        <Input
          placeholder="Enter weight e.g. 60"
          {...inputStyles}
          {...register('patientWeight')}
        />
      </FormControl>
    </>
  );
}
