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
import { HiPlus } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

interface EventDetailsProps {
  inputStyles: any;
  symptomTreated: string;
  setSymptomTreated: (val: string) => void;
  index?: number;
  onAddSymptom?: () => void;
}

export function EventDetails({
  inputStyles,
  symptomTreated,
  setSymptomTreated,
  index = 0,
  onAddSymptom,
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
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        {t('forms.patient.eventDetails.title')}
      </Heading>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.symptomLabel')}
        </FormLabel>
        <Input
          placeholder={t('forms.patient.eventDetails.symptomPlaceholder')}
          {...inputStyles}
          {...register(`${prefix}.name`)}
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.datesLabel')}
        </FormLabel>
        <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
          <Input
            type={watch(`${prefix}.eventStartDate`) === 'Unknown' ? 'text' : 'date'}
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
            {t('forms.patient.productDetails.unknown')}
          </Button>
        </Flex>
        <Flex gap={3} flexWrap="wrap" align="center">
          <Input
            type={['Unknown', 'Ongoing'].includes(watch(`${prefix}.eventEndDate`)) ? 'text' : 'date'}
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
            {t('forms.patient.productDetails.unknown')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setOngoing('eventEndDate')}
          >
            {t('forms.patient.productDetails.ongoing')}
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
              {t('forms.patient.eventDetails.yes')}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t('forms.patient.eventDetails.no')}
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

      {onAddSymptom && (
        <Button
          mb={4}
          width="full"
          bg="#CE0037"
          color="white"
          fontWeight={600}
          borderRadius="lg"
          size="lg"
          _hover={{ bg: '#E31C5F' }}
          leftIcon={<HiPlus />}
          onClick={onAddSymptom}
        >
          {t('forms.patient.eventDetails.addAnother')}
        </Button>
      )}
    </>
  );
}
