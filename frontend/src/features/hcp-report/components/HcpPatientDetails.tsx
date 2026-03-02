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
  const { t } = useTranslation();
  const { setValue, register, watch } = useFormContext();

  const setUnknown = (fieldName: string) => {
    setValue(fieldName, 'Unknown');
  };

  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.hcp.patientDetails.title')}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={2}>
        {t('forms.hcp.patientDetails.subtitle')}
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.shared.patientDetails.nameInitialsLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.shared.patientDetails.nameInitialsPlaceholder')}
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
          {t('forms.patient.common.unknown')}
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
              {t('forms.patient.personalDetails.ageValueLabel')}
            </Radio>
          </Stack>
        </RadioGroup>
        {ageType === 'dob' && (
          <Input
            type={watch('patientDob') === 'Unknown' ? 'text' : 'date'}
            placeholder={t('forms.patient.personalDetails.dobPlaceholder')}
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
            <Text color="gray.600">{t('forms.patient.personalDetails.years')}</Text>
          </Flex>
        )}
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.sexLabel')}
        </FormLabel>
        <RadioGroup 
          value={watch('patientGender') || ''} 
          onChange={(val) => setValue('patientGender', val)}
        >
          <Stack direction="row" spacing={6}>
            <Radio value="male" colorScheme="red">
              {t('forms.patient.personalDetails.male')}
            </Radio>
            <Radio value="female" colorScheme="red">
              {t('forms.patient.personalDetails.female')}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.patientDetails.referenceLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.hcp.patientDetails.referencePlaceholder')}
          {...inputStyles}
          {...register('patientReference')}
        />
      </FormControl>

      <Box mt={10} mb={6}>
        <Text fontWeight="600" color="gray.700">
          {t('forms.hcp.patientDetails.additionalTitle')}
        </Text>
        <Box borderBottom="2px solid" borderColor="#CE0037" mt={2} mb={6} w="full" maxW="200px" />
      </Box>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.patientDetails.heightLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.hcp.patientDetails.heightPlaceholder')}
          {...inputStyles}
          {...register('patientHeight')}
        />
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.patientDetails.weightLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.hcp.patientDetails.weightPlaceholder')}
          {...inputStyles}
          {...register('patientWeight')}
        />
      </FormControl>
    </>
  );
}
