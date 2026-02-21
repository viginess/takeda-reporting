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
import { useFormContext } from 'react-hook-form';

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
  const { register, setValue, watch } = useFormContext();

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
        <Input 
          placeholder="Enter first name" 
          {...inputStyles} 
          {...register('hcpDetails.firstName')} 
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel fontWeight="500" color="gray.700">
          Last name
        </FormLabel>
        <Input 
          placeholder="Enter last name" 
          {...inputStyles} 
          {...register('hcpDetails.lastName')} 
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Relationship to patient
        </FormLabel>
        <Input placeholder="Enter relationship to patient" {...inputStyles} {...register('hcpDetails.relationship')} />
      </FormControl>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          Do we have permission to contact you?
        </FormLabel>
        <RadioGroup
          value={watch('hcpDetails.contactPermission') || contactPermission}
          onChange={(val) => {
            setContactPermission(val);
            setValue('hcpDetails.contactPermission', val);
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

      {contactPermission === 'yes' && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            Your contact information
          </Text>
          <FormControl mb={4} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              Email address
            </FormLabel>
            <Input 
              placeholder="client@gmail.com" 
              type="email" 
              {...inputStyles} 
              {...register('hcpDetails.email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })} 
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              Phone number
            </FormLabel>
            <Input 
              placeholder="Enter your phone number" 
              {...inputStyles} 
              {...register('hcpDetails.phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Phone number must be exactly 10 digits'
                }
              })} 
            />
          </FormControl>
        </Box>
      )}

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          Do we have permission to contact your Healthcare Professional (HCP) about this
          report?
        </FormLabel>
        <RadioGroup
          value={watch('hcpDetails.hcpContactPermission') || hcpContactPermission}
          onChange={(val) => {
            setHcpContactPermission(val);
            setValue('hcpDetails.hcpContactPermission', val);
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

      {hcpContactPermission === 'yes' && (
        <Box mb={8} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            HCP contact information
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              First name
            </FormLabel>
            <Input placeholder="Enter first name" {...inputStyles} {...register('hcpDetails.hcpFirstName')} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Last name
            </FormLabel>
            <Input placeholder="Enter last name" {...inputStyles} {...register('hcpDetails.hcpLastName')} />
          </FormControl>
          <Text fontWeight="600" mb={3} color="gray.700" fontSize="sm">
            How do we contact them? (complete at least one of these fields)
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Email
            </FormLabel>
            <Input placeholder="Enter email address" type="email" {...inputStyles} {...register('hcpDetails.hcpEmail')} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Phone number
            </FormLabel>
            <Input placeholder="Enter number including area code" type="tel" {...inputStyles} {...register('hcpDetails.hcpPhone')} />
          </FormControl>
        </Box>
      )}

    </>
  );
}

