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
  const { t } = useTranslation();
  const { register, setValue, watch } = useFormContext();

  const setUnknown = (fieldName: string) => {
    setValue(fieldName, 'Unknown');
  };

  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.shared.patientDetails.title')}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={2}>
        {t('forms.shared.patientDetails.subtitle')}
      </Text>
      <Box borderBottom="2px solid" borderColor="#CE0037" mb={6} w="full" maxW="200px" />

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.shared.patientDetails.nameInitialsLabel')}
        </FormLabel>
        <Input placeholder={t('forms.shared.patientDetails.nameInitialsPlaceholder')} {...inputStyles} mb={2} {...register('patientDetails.initials')} />
        <Button variant="ghost" size="sm" color="gray.600" onClick={() => setUnknown('patientDetails.initials')}>
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
            placeholder={t('forms.patient.personalDetails.dobPlaceholder')}
            type="date"
            mt={3}
            {...inputStyles}
            {...register('patientDetails.dob')}
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
              {...register('patientDetails.ageValue')}
            />
            <Text color="gray.600">{t('forms.patient.personalDetails.years')}</Text>
          </Flex>
        )}
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.personalDetails.sexLabel')}
        </FormLabel>
        <RadioGroup value={watch('patientDetails.gender')} onChange={(val) => setValue('patientDetails.gender', val)}>
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

    </>
  );
}

