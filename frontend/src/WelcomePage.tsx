import {
  Box,
  Flex,
  Heading,
  Text,
  Stack,
  Select,
  Button,
  Link,
} from '@chakra-ui/react';

function WelcomePage() {
  return (
    <Flex
      direction="column"
      minH="100vh"
      bg="gray.50"
      color="gray.800"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    >
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px={12}
        py={4}
        bg="white"
        boxShadow="sm"
      >
        <Text fontWeight="bold" fontSize="lg" color="red.600">
          Takeda
        </Text>
        <Heading as="h1" size="md" mx="auto">
          Let&apos;s get started.
        </Heading>
      </Flex>

      <Flex
        as="main"
        flex="1"
        align="center"
        justify="center"
        px={4}
        pt={10}
        pb={6}
      >
        <Box
          w="100%"
          maxW="560px"
          bg="gray.800"
          borderRadius="md"
          boxShadow="2xl"
          overflow="hidden"
        >
          <Box bg="gray.900" color="white" px={8} py={5}>
            <Heading as="h2" size="md" fontWeight="medium">
              Welcome to Reportum Public
            </Heading>
          </Box>

          <Box bg="white" px={8} py={6}>
            <Stack spacing={4}>
              <Box>
                <Text mb={1} fontSize="sm" color="gray.700">
                  Please select your location
                </Text>
                <Select placeholder="Country" size="md" bg="white">
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="de">Germany</option>
                  <option value="jp">Japan</option>
                </Select>
              </Box>

              <Box>
                <Text mb={1} fontSize="sm" color="gray.700">
                  Please select a language
                </Text>
                <Select placeholder="Language" size="md" bg="white">
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="ja">日本語</option>
                </Select>
              </Box>

              <Button
                mt={1}
                colorScheme="green"
                width="100%"
                size="md"
              >
                Continue
              </Button>

              <Text fontSize="xs" color="gray.500" textAlign="center">
                Can&apos;t find your country/language?{' '}
                <Link as="button" color="blue.500" fontSize="xs">
                  Click here.
                </Link>
              </Text>
            </Stack>
          </Box>
        </Box>
      </Flex>

      <Box as="footer" py={4} px={6} textAlign="center" fontSize="sm" color="gray.600">
        <Text>
          Thank you for helping us make our products safer and more effective for everyone,
          everywhere.
        </Text>
      </Box>
    </Flex>
  );
}

export default WelcomePage;
