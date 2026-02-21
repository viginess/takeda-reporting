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
  Select,
  Flex,
} from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';

interface HcpReporterDetailsProps {
  inputStyles: any;
  contactPermission: string;
  setContactPermission: (val: string) => void;
}

export function HcpReporterDetails({
  inputStyles,
  contactPermission,
  setContactPermission,
}: HcpReporterDetailsProps) {
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

      <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
        <FormControl>
          <FormLabel fontWeight="500" color="gray.700">
            First name
          </FormLabel>
          <Input 
            placeholder="Enter first name" 
            {...inputStyles} 
            {...register('firstName')} 
          />
        </FormControl>

        <FormControl>
          <FormLabel fontWeight="500" color="gray.700">
            Last name
          </FormLabel>
          <Input 
            placeholder="Enter last name" 
            {...inputStyles} 
            {...register('lastName')} 
          />
        </FormControl>
      </Flex>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          Do we have permission to contact you for further information?
        </FormLabel>
        <RadioGroup
          value={watch('reporterDetails.contactPermission') || watch('contactPermission') || contactPermission}
          onChange={(val) => {
            setContactPermission(val);
            setValue('contactPermission', val);
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
        <>
          <Box mt={8} mb={4}>
            <Text fontWeight="600" color="gray.700">
              How should we contact you?
            </Text>
            <Box borderBottom="2px solid" borderColor="#CE0037" mt={2} mb={6} w="full" maxW="200px" />
          </Box>

          <FormControl mb={4} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              Email
            </FormLabel>
            <Input 
              placeholder="Enter email address" 
              type="email" 
              {...inputStyles} 
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })} 
            />
          </FormControl>

          <FormControl mb={6} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              Phone number
            </FormLabel>
            <Input 
              placeholder="Enter number (inc area code)" 
              type="tel" 
              {...inputStyles} 
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Phone number must be exactly 10 digits'
                }
              })} 
            />
          </FormControl>

          <Box mt={10} mb={4}>
            <Text fontWeight="600" color="gray.700">
              Additional contact details
            </Text>
            <Box borderBottom="2px solid" borderColor="#CE0037" mt={2} mb={6} w="full" maxW="200px" />
          </Box>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Hospital/Institution
            </FormLabel>
            <Input placeholder="Enter hospital/institution" {...inputStyles} {...register('institution')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              Address
            </FormLabel>
            <Input placeholder="Enter address" {...inputStyles} {...register('address')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              City/Town
            </FormLabel>
            <Input placeholder="Enter city/town" {...inputStyles} {...register('city')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              State/County/Province
            </FormLabel>
            <Input placeholder="Enter state/county/province" {...inputStyles} {...register('state')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              ZIP/Postal code
            </FormLabel>
            <Input placeholder="Enter ZIP/Postal code" {...inputStyles} {...register('zipCode')} />
          </FormControl>

          <FormControl mb={8}>
            <FormLabel fontWeight="500" color="gray.700">
              Country
            </FormLabel>
            <Select placeholder="Enter country" {...inputStyles} {...register('country')}>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
            </Select>
          </FormControl>
        </>
      )}
    </>
  );
}
