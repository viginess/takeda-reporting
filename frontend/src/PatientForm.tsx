import {
  Heading,
  Text,
  FormControl,
  FormLabel,
  Select,
  Button,
} from '@chakra-ui/react';

function PatientForm() {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Patient information
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={6}>
        Tell us a bit about yourself so we can personalize your experience.
      </Text>
      <FormControl mb={4}>
        <FormLabel>Full name</FormLabel>
        <Select placeholder="Enter your name" isDisabled size="lg" />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Condition or therapy area</FormLabel>
        <Select placeholder="Select an option" size="lg" />
      </FormControl>
      <FormControl mb={8}>
        <FormLabel>How long have you been on treatment?</FormLabel>
        <Select placeholder="Select duration" size="lg" />
      </FormControl>
      <Button
        size="lg"
        bg="#CE0037"
        color="white"
        borderRadius="lg"
        fontWeight="600"
        width="full"
        _hover={{
          bg: '#E31C5F',
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        }}
        _active={{
          bg: '#B3002F',
          transform: 'translateY(0)',
        }}
      >
        Submit
      </Button>
    </>
  );
}

export default PatientForm;

