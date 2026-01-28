import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  FormControl,
  FormLabel,
  Select,
  Button,
  Card,
  CardBody,
} from '@chakra-ui/react';

import takedaLogo from './assets/takeda-logo.png';

function WelcomePage() {
  return (
    <Flex
      direction="column"
      minH="100vh"
      bg="gray.50"
      color="gray.800"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    >
      {/* Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px={12}
        py={4}
        bg="white"
        boxShadow="sm"
      >
        <Image src={takedaLogo} alt="Takeda" h="28px" />
        <Heading as="h1" size="md" mx="auto" fontWeight={"semibold"}  letterSpacing="tight">
        Let’s take the next step toward better health
        </Heading>
      </Flex>

      {/* Main Content */}
      <Flex flex="1" align="center" justify="center" px={4}  py={2}>
        <Card maxW="900px" w="full" bg="white" boxShadow="lg" borderRadius="lg">
          <CardBody p={0}>
            <Flex direction={{ base: 'column', md: 'row' }}>
              {/* Left Side - Branding */}
              <Box
  flex="0 0 300px"
  p={8}
  display="flex"
  flexDirection="column"
  alignItems="center"
  justifyContent="center"
  color="white"
  bgGradient="linear(to-br, red.700, red.500, pink.500)"
  boxShadow="inset 0 0 40px rgba(255,255,255,0.15)"
>

                <Box 
                  w="120px" 
                  h="120px" 
                  bg="white" 
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={6}
                  boxShadow="lg"
                >
                 <Image src={takedaLogo} alt="Takeda" h="28px" />
                </Box>
                <Heading as="h2" size="lg" mb={4} textAlign="center">
                  Welcome
                </Heading>
                <Text fontSize="sm" textAlign="center" opacity={0.9}>
                  Better Health for People, Brighter Future for the World
                </Text>
              </Box>

              {/* Right Side - Form */}
              <Box flex="1" p={8} >
                {/* Country Field */}
                <FormControl mb={6}>
                  <FormLabel>Country</FormLabel>
                  <Select
                    placeholder="Select country"
                    size="lg"
                    focusBorderColor="red.600"
                    _hover={{ borderColor: 'red.500' }}
                    _focusVisible={{
                      borderColor: 'red.600',
                      boxShadow: '0 0 0 1px var(--chakra-colors-red-600)',
                    }}
                  >
                    <option value="us">United States</option>
                    <option value="uk">United Kingdom</option>
                    <option value="ca">Canada</option>
                    <option value="au">Australia</option>
                    <option value="jp">Japan</option>
                    <option value="de">Germany</option>
                    <option value="fr">France</option>
                    <option value="es">Spain</option>
                    <option value="it">Italy</option>
                    <option value="br">Brazil</option>
                  </Select>
                </FormControl>

                {/* Language Field */}
                <FormControl mb={8}>
                  <FormLabel>Language</FormLabel>
                  <Select
                    placeholder="Select language"
                    size="lg"
                    focusBorderColor="red.600"
                    _hover={{ borderColor: 'red.500' }}
                    _focusVisible={{
                      borderColor: 'red.600',
                      boxShadow: '0 0 0 1px var(--chakra-colors-red-600)',
                    }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                    <option value="ar">Arabic</option>
                  </Select>
                </FormControl>

                {/* Continue Button */}
                <Button
  size="lg"
  width="full"
  bgGradient="linear(to-r, red.600, pink.500)"
  color="white"
  _hover={{
    bgGradient: 'linear(to-r, red.700, pink.600)',
  }}
>
  Continue
</Button>


              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Flex>

      {/* Footer */}
      <Box 
        as="footer" 
        py={4} 
        px={6} 
        textAlign="center" 
        fontSize="sm" 
        color="gray.600"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
      >
        <Text>
          Thank you for helping us make our products safer and more effective for everyone,
          everywhere.
        </Text>
      </Box>
    </Flex>
  );
}

export default WelcomePage;