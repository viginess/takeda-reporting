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
  Flex,
} from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { register, setValue, watch } = useFormContext();

  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.hcp.reporterDetails.title')}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={4}>
        {t('forms.hcp.reporterDetails.subtitle')}
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
        <FormControl isRequired isInvalid={!!(watch('reporterDetails.firstName') === '' && watch('reporterDetails.firstName') !== undefined)}>
          <FormLabel fontWeight="500" color="gray.700">
            {t('forms.shared.reporterDetails.firstNameLabel')}
          </FormLabel>
          <Input 
            placeholder={t('forms.shared.reporterDetails.firstNamePlaceholder')} 
            {...inputStyles} 
            {...register('reporterDetails.firstName', { required: t('forms.shared.reporterDetails.firstNameRequired', 'First name is required') })} 
          />
          {/* Error Message */}
          <Text color="red.500" fontSize="xs" mt={1}>
            {watch('reporterDetails.firstName') === '' ? t('forms.shared.reporterDetails.firstNameRequired') : ''}
          </Text>
        </FormControl>

        <FormControl isRequired isInvalid={!!(watch('reporterDetails.lastName') === '' && watch('reporterDetails.lastName') !== undefined)}>
          <FormLabel fontWeight="500" color="gray.700">
            {t('forms.shared.reporterDetails.lastNameLabel')}
          </FormLabel>
          <Input 
            placeholder={t('forms.shared.reporterDetails.lastNamePlaceholder')} 
            {...inputStyles} 
            {...register('reporterDetails.lastName', { required: t('forms.shared.reporterDetails.lastNameRequired', 'Last name is required') })} 
          />
          <Text color="red.500" fontSize="xs" mt={1}>
            {watch('reporterDetails.lastName') === '' ? t('forms.shared.reporterDetails.lastNameRequired') : ''}
          </Text>
        </FormControl>
      </Flex>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.contactPermissionLabel')}
        </FormLabel>
        <RadioGroup
          value={watch('reporterDetails.contactPermission') || contactPermission}
          onChange={(val) => {
            setContactPermission(val);
            setValue('reporterDetails.contactPermission', val);
          }}
        >
          <Stack direction="row" spacing={6}>
            <Radio value="yes" colorScheme="red">
              {t('forms.patient.common.yes')}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t('forms.patient.common.no')}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {contactPermission === 'yes' && (
        <>
          <Box mt={8} mb={4}>
            <Text fontWeight="600" color="gray.700">
              {t('forms.patient.personalDetails.contactPreferenceLabel')}
            </Text>
            <Box borderBottom="2px solid" borderColor="#CE0037" mt={2} mb={6} w="full" maxW="200px" />
          </Box>

          <FormControl mb={4} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.emailLabel')}
            </FormLabel>
            <Input 
              placeholder={t('forms.patient.personalDetails.emailPlaceholder')} 
              type="email" 
              {...inputStyles} 
              {...register('reporterDetails.email', { 
                required: t('forms.patient.personalDetails.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('forms.patient.personalDetails.invalidEmail')
                }
              })} 
            />
            <Text color="red.500" fontSize="xs" mt={1}>
              {watch('reporterDetails.email') === '' ? t('forms.patient.personalDetails.emailRequired') : ''}
            </Text>
          </FormControl>

          <FormControl mb={6} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.phoneLabel')}
            </FormLabel>
            <Input 
              placeholder={t('forms.patient.personalDetails.phonePlaceholder')} 
              type="tel" 
              {...inputStyles} 
              {...register('reporterDetails.phone', { 
                required: t('forms.patient.personalDetails.phoneRequired'),
                pattern: {
                  value: /^\d{10}$/,
                  message: t('forms.patient.personalDetails.phoneDigits')
                }
              })} 
            />
            {/* Phone specific error hint */}
            <Text color="red.500" fontSize="xs" mt={1}>
              {watch('reporterDetails.phone') && !/^\d{10}$/.test(watch('reporterDetails.phone')) ? t('forms.patient.personalDetails.phoneDigits', 'Must be 10 digits') : ''}
            </Text>
          </FormControl>

          <Box mt={10} mb={4}>
            <Text fontWeight="600" color="gray.700">
              {t('forms.patient.personalDetails.contactInfoTitle')}
            </Text>
            <Box borderBottom="2px solid" borderColor="#CE0037" mt={2} mb={6} w="full" maxW="200px" />
          </Box>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.institutionLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.institutionPlaceholder')} {...inputStyles} {...register('reporterDetails.institution')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.addressLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.addressPlaceholder')} {...inputStyles} {...register('reporterDetails.address')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.cityLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.cityLabel')} {...inputStyles} {...register('reporterDetails.city')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.stateLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.stateLabel')} {...inputStyles} {...register('reporterDetails.state')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.zipLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.zipLabel')} {...inputStyles} {...register('reporterDetails.zipCode')} />
          </FormControl>

          <FormControl mb={8} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.countryLabel')}
            </FormLabel>
            <Input 
              placeholder={t('forms.hcp.reporterDetails.countryPlaceholder', 'Type Country')} 
              {...inputStyles} 
              {...register('reporterDetails.country', { required: t('forms.shared.reporterDetails.countryRequired', 'Country is required') })}
            />
          </FormControl>
        </>
      )}
    </>
  );
}
