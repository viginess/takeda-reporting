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
  CheckboxGroup,
  Checkbox,
} from '@chakra-ui/react';

interface EventDetailsProps {
  inputStyles: any;
  symptomTreated: string;
  setSymptomTreated: (val: string) => void;
}

export function EventDetails({
  inputStyles,
  symptomTreated,
  setSymptomTreated,
}: EventDetailsProps) {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Okay, tell us more about the adverse event(s)
      </Heading>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          What is the symptom?
        </FormLabel>
        <Input
          placeholder="Enter symptom (e.g. nausea)"
          {...inputStyles}
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          On which dates did you first/last experience the symptom?
        </FormLabel>
        <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
          <Input
            placeholder="Select start date"
            flex="1"
            minW="140px"
            type="date"
            {...inputStyles}
          />
          <Button variant="outline" size="lg" borderColor="gray.300">
            Unknown
          </Button>
        </Flex>
        <Flex gap={3} flexWrap="wrap" align="center">
          <Input
            placeholder="Select end date"
            flex="1"
            minW="140px"
            type="date"
            {...inputStyles}
          />
          <Button variant="outline" size="lg" borderColor="gray.300">
            Unknown
          </Button>
          <Button variant="outline" size="lg" borderColor="gray.300">
            Ongoing
          </Button>
        </Flex>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Was the symptom treated?
        </FormLabel>
        <RadioGroup value={symptomTreated} onChange={setSymptomTreated}>
          <Stack direction="row" spacing={6}>
            <Radio value="yes" colorScheme="red">
              Yes
            </Radio>
            <Radio value="no" colorScheme="red">
              No
            </Radio>
          </Stack>
        </RadioGroup>
        {symptomTreated === 'yes' && (
          <Box mt={4}>
            <FormLabel fontWeight="500" color="gray.700">
              How was the symptom treated?
            </FormLabel>
            <Textarea
              placeholder="Enter treatment type"
              rows={4}
              maxLength={100}
              {...inputStyles}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              0/100
            </Text>
          </Box>
        )}
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          Was the symptom serious?
        </FormLabel>
        <CheckboxGroup colorScheme="red">
          <Stack spacing={2}>
            <Checkbox value="not-serious">The symptom was not serious</Checkbox>
            <Checkbox value="medical-intervention">Medical intervention required</Checkbox>
            <Checkbox value="hospitalization">Hospitalization required</Checkbox>
            <Checkbox value="life-threatening">Life threatening</Checkbox>
            <Checkbox value="disability">Persistent/Significant disability</Checkbox>
            <Checkbox value="congenital">Congenital anomaly/birth defect</Checkbox>
            <Checkbox value="medically-significant">Medically significant</Checkbox>
          </Stack>
        </CheckboxGroup>
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          What was the outcome of the symptom?
        </FormLabel>
        <RadioGroup defaultValue="">
          <Stack spacing={2}>
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

      <Button
        mb={4}
        width="full"
        bg="gray.700"
        color="white"
        size="lg"
        fontWeight="600"
        borderRadius="lg"
        _hover={{ bg: 'gray.800' }}
      >
        Add another symptom +
      </Button>
    </>
  );
}
