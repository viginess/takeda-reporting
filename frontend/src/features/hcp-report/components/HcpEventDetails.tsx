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
        Enter adverse event(s) information
      </Heading>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          What is the patient's symptom?
        </FormLabel>
        <Input
          placeholder="Enter symptom (e.g. nausea)"
          {...inputStyles}
          {...register(`${prefix}.name`)}
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          What date did they first/last experience their symptom?
        </FormLabel>
        <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
          <Input
            type={watch(`${prefix}.eventStartDate`) === 'Unknown' ? 'text' : 'date'}
            placeholder="Select start date"
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
            Unknown
          </Button>
        </Flex>
        <Flex gap={3} flexWrap="wrap" align="center">
          <Input
            type={['Unknown', 'Ongoing'].includes(watch(`${prefix}.eventEndDate`)) ? 'text' : 'date'}
            placeholder="Select end date"
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
            Unknown
          </Button>
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setOngoing('eventEndDate')}
          >
            Ongoing
          </Button>
        </Flex>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Was the symptom treated?
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
              Yes
            </Radio>
            <Radio value="no" colorScheme="red">
              No
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          How serious was the symptom?
        </FormLabel>
        <RadioGroup 
          value={watch(`${prefix}.seriousness`)}
          onChange={(val) => setValue(`${prefix}.seriousness`, val)}
        >
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="not-serious" colorScheme="red">The symptom was not serious</Radio>
            <Radio value="medical-intervention" colorScheme="red">Medical intervention required</Radio>
            <Radio value="hospitalization" colorScheme="red">Hospitalization required</Radio>
            <Radio value="life-threatening" colorScheme="red">Life threatening</Radio>
            <Radio value="disability" colorScheme="red">Persistent/Significant disability</Radio>
            <Radio value="congenital" colorScheme="red">Congenital anomaly/birth defect</Radio>
            <Radio value="medically-significant" colorScheme="red">Medically significant</Radio>
            <Radio value="death" colorScheme="red">Death</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          What was the outcome of the symptom?
        </FormLabel>
        <RadioGroup onChange={(val) => setValue(`${prefix}.outcome`, val)}>
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="recovered" colorScheme="red">
              Recovered completely
            </Radio>
            <Radio value="recovered-lasting" colorScheme="red">
              Recovered with lasting effects
            </Radio>
            <Radio value="improved" colorScheme="red">
              Improved
            </Radio>
            <Radio value="ongoing" colorScheme="red">
              Ongoing
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <Box mt={10} mb={6}>
        <Text fontWeight="600" color="gray.700" fontSize="sm">
          In the reporter's medical opinion, is there a reasonable possibility this event is related
          to this suspect product(s)?
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
          Suspect product: {firstProductName || 'Unknown Product'}
        </Text>
        <RadioGroup onChange={(val) => setValue(`${prefix}.relatedToProduct`, val)}>
          <Stack spacing={2}>
            <Radio value="yes" colorScheme="red">
              Yes
            </Radio>
            <Radio value="no" colorScheme="red">
              No
            </Radio>
            <Radio value="unknown" colorScheme="red">
              Unknown
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
          Add another symptom
        </Button>
      )}
    </>
  );
}
