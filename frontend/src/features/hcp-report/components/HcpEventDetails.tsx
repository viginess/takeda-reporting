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
  Text,
} from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import { HiPlus } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

interface HcpEventDetailsProps {
  inputStyles: any;
  symptomTreated: string;
  setSymptomTreated: (val: string) => void;
  index?: number;
  onAddSymptom?: () => void;
}

export function HcpEventDetails({
  inputStyles,
  symptomTreated,
  setSymptomTreated,
  index = 0,
  onAddSymptom,
}: HcpEventDetailsProps) {
  const { t } = useTranslation();
  const { setValue, register, watch } = useFormContext();

  const prefix = `symptoms.${index}`;
  const firstProductName = watch('products.0.productName');

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
          {t('forms.patient.eventDetails.symptomQuestion')}
        </FormLabel>
        <Input
          placeholder={t('forms.patient.eventDetails.symptomPlaceholder')}
          {...inputStyles}
          {...register(`${prefix}.name`)}
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.patient.eventDetails.dateQuestion')}
        </FormLabel>
        <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
          <Input
            type={watch(`${prefix}.eventStartDate`) === 'Unknown' ? 'text' : 'date'}
            placeholder={t('forms.patient.eventDetails.startDatePlaceholder')}
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
            type={['Unknown', 'Ongoing'].includes(watch(`${prefix}.eventEndDate`)) ? 'text' : 'date'}
            placeholder={t('forms.patient.eventDetails.endDatePlaceholder')}
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
          {t('forms.patient.eventDetails.treatedQuestion')}
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
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.eventDetails.seriousness.label')}
        </FormLabel>
        <RadioGroup 
          value={watch(`${prefix}.seriousness`)}
          onChange={(val) => setValue(`${prefix}.seriousness`, val)}
        >
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="not-serious" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.not-serious')}</Radio>
            <Radio value="medical-intervention" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.medical-intervention')}</Radio>
            <Radio value="hospitalization" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.hospitalization')}</Radio>
            <Radio value="life-threatening" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.life-threatening')}</Radio>
            <Radio value="disability" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.disability')}</Radio>
            <Radio value="congenital" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.congenital')}</Radio>
            <Radio value="medically-significant" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.medically-significant')}</Radio>
            <Radio value="death" colorScheme="red">{t('forms.hcp.eventDetails.seriousness.death')}</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t('forms.hcp.eventDetails.outcome.label')}
        </FormLabel>
        <RadioGroup 
          value={watch(`${prefix}.outcome`)}
          onChange={(val) => setValue(`${prefix}.outcome`, val)}
        >
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="recovered" colorScheme="red">
              {t('forms.hcp.eventDetails.outcome.recovered')}
            </Radio>
            <Radio value="recovered-lasting" colorScheme="red">
              {t('forms.hcp.eventDetails.outcome.recovered-lasting')}
            </Radio>
            <Radio value="improved" colorScheme="red">
              {t('forms.hcp.eventDetails.outcome.improved')}
            </Radio>
            <Radio value="ongoing" colorScheme="red">
              {t('forms.hcp.eventDetails.outcome.ongoing')}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <Box mt={10} mb={6}>
        <Text fontWeight="600" color="gray.700" fontSize="sm">
          {t('forms.hcp.eventDetails.relatedness.label')}
        </Text>
      </Box>

      <Box
        p={5}
        bg="gray.50"
        borderRadius="xl"
        mb={8}
        border="1px solid"
        borderColor="gray.100"
        boxShadow="sm"
      >
        <Text fontWeight="700" mb={4} color="gray.800" fontSize="sm">
          {t('forms.hcp.eventDetails.relatedness.suspectProduct', { product: firstProductName || t('forms.patient.common.unknown') })}
        </Text>
        <RadioGroup 
          value={watch(`${prefix}.relatedToProduct`)}
          onChange={(val) => setValue(`${prefix}.relatedToProduct`, val)}
        >
          <Stack spacing={2}>
            <Radio value="yes" colorScheme="red">
              {t('forms.patient.common.yes')}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t('forms.patient.common.no')}
            </Radio>
            <Radio value="unknown" colorScheme="red">
              {t('forms.patient.common.unknown')}
            </Radio>
          </Stack>
        </RadioGroup>
      </Box>

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
          {t('forms.patient.eventDetails.anotherSymptom')}
        </Button>
      )}
    </>
  );
}
