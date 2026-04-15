import {
  FormControl,
  FormLabel,
  Input,
  Flex,
  Button,
  Heading,
  RadioGroup,
  Stack,
  Radio,
  Box,
  Textarea,
  Text,
} from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MedDRASymptomAutocomplete } from '../../../shared/components/meddra/MedDRASymptomAutocomplete';

interface EventDetailsProps {
  inputStyles: any;
  symptomTreated: string;
  setSymptomTreated: (val: string) => void;
  index?: number;
  symptomNumber?: number;
}

export function EventDetails({
  inputStyles,
  symptomTreated,
  setSymptomTreated,
  index = 0,
  symptomNumber = 1,
}: EventDetailsProps) {
  const { t } = useTranslation();
  const { setValue, register, watch } = useFormContext();

  const prefix = `symptoms.${index}`;

  const setUnknown = (fieldName: string) => {
    setValue(`${prefix}.${fieldName}`, 'Unknown');
  };

  const setOngoing = (fieldName: string) => {
    setValue(`${prefix}.${fieldName}`, 'Ongoing');
  };

  return (
    <>
      <Heading as="h2" size="lg" mb={6} color="#CE0037" fontWeight="600">
        {t('forms.patient.eventDetails.title')} {symptomNumber > 1 ? `#${symptomNumber}` : ''}
      </Heading>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.symptomLabel')}
        </FormLabel>
        <MedDRASymptomAutocomplete
          value={watch(`${prefix}.name`) || ''}
          onChange={(val, code, extra) => {
            setValue(`${prefix}.name`, val, { shouldDirty: true });
            if (code) {
              setValue(`${prefix}.meddraCode`, code, { shouldDirty: true });
            }
            if (extra) {
              setValue(`${prefix}.lltCode`, extra.lltCode, { shouldDirty: true });
              setValue(`${prefix}.lltName`, extra.lltName, { shouldDirty: true });
              setValue(`${prefix}.ptCode`, extra.ptCode, { shouldDirty: true });
              setValue(`${prefix}.ptName`, extra.ptName, { shouldDirty: true });
            }
          }}
          inputStyles={inputStyles}
        />
        {/* Hidden field to pass the MedDRA LLT code on submit */}
        <Input type="hidden" {...register(`${prefix}.meddraCode`)} />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.datesLabel')}
        </FormLabel>
        <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
          <Input
            key={watch(`${prefix}.eventStartDate`) === 'Unknown' ? 'untouchable' : 'selectable'}
            type={watch(`${prefix}.eventStartDate`) === 'Unknown' ? 'text' : 'date'}
            value={watch(`${prefix}.eventStartDate`) === 'Unknown' ? t('forms.patient.common.unknown') : (watch(`${prefix}.eventStartDate`) || '')}
            placeholder={t('forms.patient.productDetails.startDatePlaceholder')}
            flex="1"
            minW="140px"
            {...inputStyles}
            {...register(`${prefix}.eventStartDate`)}
          />
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setUnknown('eventStartDate')}
          >
            {t('forms.patient.common.unknown')}
          </Button>
        </Flex>
        <Flex gap={3} flexWrap="wrap" align="center">
          <Input
            key={['Unknown', 'Ongoing'].includes(watch(`${prefix}.eventEndDate`)) ? 'untouchable' : 'selectable'}
            type={['Unknown', 'Ongoing'].includes(watch(`${prefix}.eventEndDate`)) ? 'text' : 'date'}
            value={watch(`${prefix}.eventEndDate`) === 'Unknown' ? t('forms.patient.common.unknown') : watch(`${prefix}.eventEndDate`) === 'Ongoing' ? t('forms.patient.common.ongoing') : (watch(`${prefix}.eventEndDate`) || '')}
            placeholder={t('forms.patient.productDetails.endDatePlaceholder')}
            flex="1"
            minW="140px"
            {...inputStyles}
            {...register(`${prefix}.eventEndDate`)}
          />
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setUnknown('eventEndDate')}
          >
            {t('forms.patient.common.unknown')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setOngoing('eventEndDate')}
          >
            {t('forms.patient.common.ongoing')}
          </Button>
        </Flex>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.treatedLabel')}
        </FormLabel>
        <RadioGroup
          value={symptomTreated}
          onChange={(val) => {
            setSymptomTreated(val);
            setValue(`${prefix}.symptomTreated`, val);
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
        {symptomTreated === 'yes' && (
          <Box mt={4}>
            <FormLabel fontWeight="500" color="gray.700">
              {t('forms.patient.eventDetails.treatmentLabel')}
            </FormLabel>
            <Textarea
              placeholder={t('forms.patient.eventDetails.treatmentPlaceholder')}
              rows={4}
              maxLength={100}
              {...inputStyles}
              {...register(`${prefix}.treatment`)}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              0/100
            </Text>
          </Box>
        )}
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.seriousLabel')}
        </FormLabel>
        <RadioGroup 
          value={watch(`${prefix}.seriousness`)}
          onChange={(val) => setValue(`${prefix}.seriousness`, val)}
        >
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="not-serious" colorScheme="red">{t('forms.patient.eventDetails.seriousness.notSerious')}</Radio>
            <Radio value="medical-intervention" colorScheme="red">{t('forms.patient.eventDetails.seriousness.medicalIntervention')}</Radio>
            <Radio value="hospitalization" colorScheme="red">{t('forms.patient.eventDetails.seriousness.hospitalization')}</Radio>
            <Radio value="life-threatening" colorScheme="red">{t('forms.patient.eventDetails.seriousness.lifeThreatening')}</Radio>
            <Radio value="disability" colorScheme="red">{t('forms.patient.eventDetails.seriousness.disability')}</Radio>
            <Radio value="congenital" colorScheme="red">{t('forms.patient.eventDetails.seriousness.congenital')}</Radio>
            <Radio value="medically-significant" colorScheme="red">{t('forms.patient.eventDetails.seriousness.medicallySignificant')}</Radio>
            <Radio value="death" colorScheme="red">{t('forms.patient.eventDetails.seriousness.death')}</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.outcomeLabel')}
        </FormLabel>
        <RadioGroup 
          value={watch(`${prefix}.outcome`)}
          onChange={(val) => setValue(`${prefix}.outcome`, val)}
        >
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="recovered" colorScheme="red">
              {t('forms.patient.eventDetails.outcomes.recovered')}
            </Radio>
            <Radio value="recovered-lasting" colorScheme="red">
              {t('forms.patient.eventDetails.outcomes.recoveredLasting')}
            </Radio>
            <Radio value="improved" colorScheme="red">
              {t('forms.patient.eventDetails.outcomes.improved')}
            </Radio>
            <Radio value="ongoing" colorScheme="red">
              {t('forms.patient.eventDetails.outcomes.ongoing')}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>


    </>
  );
}
