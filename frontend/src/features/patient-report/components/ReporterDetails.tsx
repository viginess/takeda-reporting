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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { register, setValue, watch } = useFormContext();

  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.shared.reporterDetails.title')}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={4}>
        {t('forms.shared.reporterDetails.subtitle')}
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      <FormControl mb={4}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.shared.reporterDetails.firstNameLabel')}
        </FormLabel>
        <Input 
          placeholder={t('forms.shared.reporterDetails.firstNamePlaceholder')}
          {...inputStyles} 
          {...register('hcpDetails.firstName')} 
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.shared.reporterDetails.lastNameLabel')}
        </FormLabel>
        <Input 
          placeholder={t('forms.shared.reporterDetails.lastNamePlaceholder')}
          {...inputStyles} 
          {...register('hcpDetails.lastName')} 
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.shared.reporterDetails.relationshipLabel')}
        </FormLabel>
        <Input placeholder={t('forms.shared.reporterDetails.relationshipPlaceholder')} {...inputStyles} {...register('hcpDetails.relationship')} />
      </FormControl>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.contactPermissionLabel')}
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
            {t('forms.patient.personalDetails.contactInfoTitle')}
          </Text>
          <FormControl mb={4} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.emailLabel')}
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
              {t('forms.patient.personalDetails.phoneLabel')}
            </FormLabel>
            <Input 
              placeholder={t('forms.patient.personalDetails.phonePlaceholder')} 
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
          {t('forms.patient.personalDetails.hcpPermissionLabel')}
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
            {t('forms.patient.personalDetails.hcpTitle')}
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.firstNameLabel')}
            </FormLabel>
            <Input placeholder="Enter first name" {...inputStyles} {...register('hcpDetails.hcpFirstName')} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.lastNameLabel')}
            </FormLabel>
            <Input placeholder="Enter last name" {...inputStyles} {...register('hcpDetails.hcpLastName')} />
          </FormControl>
          <Text fontWeight="600" mb={3} color="gray.700" fontSize="sm">
            {t('forms.patient.personalDetails.hcpContactMethodSubtitle')}
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.emailLabel')}
            </FormLabel>
            <Input placeholder="Enter email address" type="email" {...inputStyles} {...register('hcpDetails.hcpEmail')} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.phoneLabel')}
            </FormLabel>
            <Input placeholder="Enter number including area code" type="tel" {...inputStyles} {...register('hcpDetails.hcpPhone')} />
          </FormControl>
        </Box>
      )}

    </>
  );
}

