import { Alert, AlertIcon, AlertTitle, AlertDescription, Flex, Box, VStack, Text } from "@chakra-ui/react";

export function ValidationBanner({ isValid, errors }: { isValid?: boolean, errors?: any[] }) {
  const hasErrors = errors && errors.length > 0;
  if ((isValid === undefined || isValid) && !hasErrors) return null;

  return (
    <Alert
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="flex-start"
      borderRadius="xl"
      p={5}
      mb={6}
      border="1px solid"
      borderColor="red.200"
      bg="red.50"
    >
      <Flex align="center" gap={3} mb={3}>
        <AlertIcon />
        <Box>
          <AlertTitle fontSize="sm" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">
            Regulatory Compliance Failure
          </AlertTitle>
          <AlertDescription fontSize="xs" fontWeight="semibold" color="gray.600">
            This report does not meet ICH E2B(R3) standards. Fix the following:
          </AlertDescription>
        </Box>
      </Flex>
      
      <VStack align="stretch" spacing={2} w="full" pl={8}>
        {(errors || []).map((err: any, i) => (
          <Flex key={i} align="flex-start" gap={2}>
            <Text fontSize="xs" fontWeight="bold" color="red.700">
              • {typeof err === 'string' ? err : (err.message || 'Unknown regulatory error')}
            </Text>
          </Flex>
        ))}
      </VStack>
    </Alert>
  );
}
