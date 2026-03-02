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
        <FormControl>
          <FormLabel fontWeight="500" color="gray.700">
            {t('forms.shared.reporterDetails.firstNameLabel')}
          </FormLabel>
          <Input 
            placeholder={t('forms.shared.reporterDetails.firstNamePlaceholder')} 
            {...inputStyles} 
            {...register('firstName')} 
          />
        </FormControl>

        <FormControl>
          <FormLabel fontWeight="500" color="gray.700">
            {t('forms.shared.reporterDetails.lastNameLabel')}
          </FormLabel>
          <Input 
            placeholder={t('forms.shared.reporterDetails.lastNamePlaceholder')} 
            {...inputStyles} 
            {...register('lastName')} 
          />
        </FormControl>
      </Flex>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.contactPermissionLabel')}
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
              {...register('email', { 
                required: t('forms.patient.personalDetails.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('forms.patient.personalDetails.invalidEmail')
                }
              })} 
            />
          </FormControl>

          <FormControl mb={6} isRequired>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.phoneLabel')}
            </FormLabel>
            <Input 
              placeholder={t('forms.patient.personalDetails.phonePlaceholder')} 
              type="tel" 
              {...inputStyles} 
              {...register('phone', { 
                required: t('forms.patient.personalDetails.phoneRequired'),
                pattern: {
                  value: /^\d{10}$/,
                  message: t('forms.patient.personalDetails.phoneDigits')
                }
              })} 
            />
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
            <Input placeholder={t('forms.hcp.reporterDetails.institutionPlaceholder')} {...inputStyles} {...register('institution')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.addressLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.addressPlaceholder')} {...inputStyles} {...register('address')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.cityLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.cityLabel')} {...inputStyles} {...register('city')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.stateLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.stateLabel')} {...inputStyles} {...register('state')} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.zipLabel')}
            </FormLabel>
            <Input placeholder={t('forms.hcp.reporterDetails.zipLabel')} {...inputStyles} {...register('zipCode')} />
          </FormControl>

          <FormControl mb={8}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.hcp.reporterDetails.countryLabel')}
            </FormLabel>
            <Select placeholder={t('forms.hcp.reporterDetails.countryLabel')} {...inputStyles} {...register('country')}>
              <option value="us">{t('forms.hcp.reporterDetails.countries.us')}</option>
              <option value="uk">{t('forms.hcp.reporterDetails.countries.uk')}</option>
              <option value="ca">{t('forms.hcp.reporterDetails.countries.ca')}</option>
            </Select>
          </FormControl>
        </>
      )}
    </>
  );
}
