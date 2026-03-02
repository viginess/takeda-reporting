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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { setValue, register, watch } = useFormContext();

  const setUnknown = (fieldName: string) => {
    setValue(fieldName, 'Unknown');
  };

  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.patient.personalDetails.title')}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={2}>
        {t('forms.patient.personalDetails.subtitle')}
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      {/* ── Patient Details ─────────────────────────────── */}
      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.initialsLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.patient.personalDetails.initialsPlaceholder')}
          {...inputStyles}
          mb={2}
          {...register('patientDetails.initials')}
        />
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          onClick={() => setUnknown('patientDetails.initials')}
        >
          {t('forms.patient.personalDetails.preferNotToProvide')}
        </Button>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.ageLabel')}
        </FormLabel>
        <RadioGroup value={ageType} onChange={(val) => setAgeType(val as 'dob' | 'age' | '')}>
          <Stack spacing={2}>
            <Radio value="dob" colorScheme="red">
              {t('forms.patient.personalDetails.dobLabel')}
            </Radio>
            <Radio value="age" colorScheme="red">
              {t('forms.patient.personalDetails.ageOption')}
            </Radio>
          </Stack>
        </RadioGroup>
        {ageType === 'dob' && (
          <Input
            type={watch('patientDetails.dob') === 'Unknown' ? 'text' : 'date'}
            placeholder={t('forms.patient.personalDetails.dobPlaceholder')}
            mt={3}
            {...inputStyles}
            {...register('patientDetails.dob')}
          />
        )}
        {ageType === 'age' && (
          <Flex gap={3} mt={3} align="center">
            <Input
              placeholder="32"
              type={watch('patientDetails.ageValue') === 'Unknown' ? 'text' : 'number'}
              flex="1"
              maxW="120px"
              {...inputStyles}
              {...register('patientDetails.ageValue')}
            />
            <Text color="gray.600">{t('forms.patient.personalDetails.years')}</Text>
          </Flex>
        )}
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.sexLabel')}
        </FormLabel>
        <RadioGroup
          onChange={(val) => setValue('patientDetails.gender', val)}
        >
          <Stack direction="row" spacing={6}>
            <Radio value="male" colorScheme="red">
              {t('forms.patient.personalDetails.sexOptions.male')}
            </Radio>
            <Radio value="female" colorScheme="red">
              {t('forms.patient.personalDetails.sexOptions.female')}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.contactPermissionLabel')}
        </FormLabel>
        <RadioGroup
          value={contactPermission}
          onChange={(val) => {
            setContactPermission(val);
            setValue('patientDetails.contactPermission', val);
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
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.emailLabel')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.emailPlaceholder')}
              type="email"
              {...inputStyles}
              {...register('patientDetails.email')}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.nameLabel')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.namePlaceholder')}
              {...inputStyles}
              {...register('patientDetails.name')}
            />
          </FormControl>
        </Box>
      )}

      {/* ── HCP Details ──────────────────────────────────── */}
      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.hcpPermissionLabel')}
        </FormLabel>
        <RadioGroup
          value={hcpContactPermission}
          onChange={(val) => {
            setHcpContactPermission(val);
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

      {hcpContactPermission === 'yes' && (
        <Box mb={8} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="600" mb={4} color="gray.700">
            {t('forms.patient.personalDetails.hcpTitle')}
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.firstNameLabel')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.firstNamePlaceholder')}
              {...inputStyles}
              {...register('hcpDetails.firstName')}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.lastNameLabel')}
            </FormLabel>
            <Input placeholder={t('forms.patient.personalDetails.lastNamePlaceholder')} {...inputStyles} {...register('hcpDetails.lastName')} />
          </FormControl>
          <Text fontWeight="600" mb={3} color="gray.700" fontSize="sm">
            {t('forms.patient.personalDetails.hcpContactMethodSubtitle')}
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.emailLabel')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.emailPlaceholder')}
              type="email"
              {...inputStyles}
              {...register('hcpDetails.email')}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.phoneLabel', 'Phone number')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.phonePlaceholder', 'Enter number including area code')}
              type="tel"
              {...inputStyles}
              {...register('hcpDetails.phone')}
            />
          </FormControl>
          <Text fontWeight="600" mb={3} color="gray.700" fontSize="sm">
            {t('forms.patient.personalDetails.hcpAdditionalTitle')}
          </Text>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.institutionLabel')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.institutionPlaceholder')}
              {...inputStyles}
              {...register('hcpDetails.institution')}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.addressLabel')}
            </FormLabel>
            <Input placeholder={t('forms.patient.personalDetails.addressPlaceholder')} {...inputStyles} {...register('hcpDetails.address')} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.cityLabel')}
            </FormLabel>
            <Input placeholder={t('forms.patient.personalDetails.cityPlaceholder')} {...inputStyles} {...register('hcpDetails.city')} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.stateLabel')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.statePlaceholder')}
              {...inputStyles}
              {...register('hcpDetails.state')}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.zipLabel')}
            </FormLabel>
            <Input
              placeholder={t('forms.patient.personalDetails.zipPlaceholder')}
              {...inputStyles}
              {...register('hcpDetails.zipCode')}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.personalDetails.countryLabel')}
            </FormLabel>
            <Input placeholder={t('forms.patient.personalDetails.countryPlaceholder')} {...inputStyles} {...register('hcpDetails.country')} />
          </FormControl>
        </Box>
      )}
    </>
  );
}
