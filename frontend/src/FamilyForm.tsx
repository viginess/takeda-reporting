import {
  Heading,
  Text,
  FormControl,
  FormLabel,
  Select,
  Button,
} from '@chakra-ui/react';

function FamilyForm() {
  return (
    <>
      <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
        Family &amp; caregiver
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={6}>
        Share a few details to help us support you and your loved one.
      </Text>
      <FormControl mb={4}>
        <FormLabel>Your relationship</FormLabel>
        <Select placeholder="Select relationship" size="lg" />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Country of residence</FormLabel>
        <Select placeholder="Select country" size="lg" />
      </FormControl>
      <FormControl mb={8}>
        <FormLabel>Primary area of interest</FormLabel>
        <Select placeholder="Select topic" size="lg" />
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

export default FamilyForm;

