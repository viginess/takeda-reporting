import {
  Heading,
  Text,
  FormControl,
  FormLabel,
  Select,
  Button,
} from '@chakra-ui/react';

function HcpForm() {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Healthcare professional
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={6}>
        Provide your professional details to access HCP-tailored resources.
      </Text>
      <FormControl mb={4}>
        <FormLabel>Specialty</FormLabel>
        <Select placeholder="Select specialty" size="lg" />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Practice setting</FormLabel>
        <Select placeholder="Select practice type" size="lg" />
      </FormControl>
      <FormControl mb={8}>
        <FormLabel>Years in practice</FormLabel>
        <Select placeholder="Select range" size="lg" />
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

export default HcpForm;

