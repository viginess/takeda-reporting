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
  SimpleGrid,
  Link,
  HStack,
} from '@chakra-ui/react';
import { useState } from 'react';

import logo from './assets/logo.jpg';
import PatientForm from './features/patient-report';
import FamilyForm from './features/family-report';
import HcpForm from './features/hcp-report';
import { countries } from './utils/countries';
import { languages } from './utils/languages';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './components/LanguageSelector';

type Step = 'select' | 'audience' | 'patient' | 'family' | 'hcp';

function WelcomePage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('select');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');

  const handleContinue = () => {
    if (country && language) {
      setStep('audience');
    }
  };

  if (step === 'patient') {
    return <PatientForm onBack={() => setStep('audience')} />;
  }

  if (step === 'family') {
    return <FamilyForm onBack={() => setStep('audience')} />;
  }

  if (step === 'hcp') {
    return <HcpForm onBack={() => setStep('audience')} />;
  }

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
        py={5}
        bg="white"
        boxShadow="sm"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Link href="/">
    <Image src={logo} alt="Clin Solutions L.L.C." h="48px" cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
  </Link>
        <HStack spacing={4}>
          <LanguageSelector />
          <Heading
            as="h1"
            size="md"
            fontWeight="600"
            letterSpacing="tight"
            color="gray.800"
          >
            {t('welcome.title')}
          </Heading>
        </HStack>
      </Flex>

      {/* Main Content */}
      <Flex flex="1" align="center" justify="center" px={4} py={8}>
        <Card
          maxW="900px"
          w="full"
          bg="white"
          boxShadow="xl"
          borderRadius="xl"
          overflow="hidden"
        >
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
                bgGradient="linear(to-br, #CE0037, #E31C5F)"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                }}
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
                  boxShadow="0 10px 30px rgba(0,0,0,0.2)"
                  position="relative"
                  zIndex={1}
                >
                  <Image src={logo} alt="Clin Solutions L.L.C." h="60px" w="auto" objectFit="contain" />
                </Box>
                <Heading 
                  as="h2" 
                  size="xl" 
                  mb={4} 
                  textAlign="center"
                  fontWeight="700"
                  position="relative"
                  zIndex={1}
                >
                  Welcome
                </Heading>
                <Text
                  fontSize="sm"
                  textAlign="center"
                  opacity={0.95}
                  fontWeight="400"
                  lineHeight="tall"
                  position="relative"
                  zIndex={1}
                >
                  {t('welcome.subtitle')}
                </Text>
              </Box>

              {/* Right Side - Form / Audience / Role Pages */}
              <Box flex="1" p={10}>
                {step === 'select' ? (
                  <>
                    <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
                      {t('welcome.getStarted')}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={8}>
                      {t('welcome.select_country_language', 'Please select your country and preferred language')}
                    </Text>

                    {/* Country Field */}
                    <FormControl mb={6}>
                      <FormLabel fontWeight="600" color="gray.700" mb={2}>
                        Country
                      </FormLabel>
                      <Select
                        placeholder="Select country"
                        size="lg"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        focusBorderColor="red.500"
                        borderColor="gray.300"
                        borderRadius="lg"
                        _hover={{ borderColor: 'red.400' }}
                        _focusVisible={{
                          borderColor: 'red.500',
                          boxShadow: '0 0 0 1px #E31C5F',
                        }}
                      >
                        {countries.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.name}
                                  </option>
                                ))}
                      </Select>
                    </FormControl>

                    {/* Language Field */}
                    <FormControl mb={10}>
                      <FormLabel fontWeight="600" color="gray.700" mb={2}>
                        Language
                      </FormLabel>
                      <Select
                        placeholder="Select language"
                        size="lg"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        focusBorderColor="red.500"
                        borderColor="gray.300"
                        borderRadius="lg"
                        _hover={{ borderColor: 'red.400' }}
                        _focusVisible={{
                          borderColor: 'red.500',
                          boxShadow: '0 0 0 1px #E31C5F',
                        }}
                      >   
                         {languages.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.name}
                            </option>
                          ))}
                      </Select>
                    </FormControl>

                    {/* Continue Button */}
                    <Button
                      size="lg"
                      width="full"
                      bg="#CE0037"
                      color="white"
                      onClick={handleContinue}
                      isDisabled={!country || !language}
                      borderRadius="lg"
                      fontWeight="600"
                      _hover={{
                        bg: '#E31C5F',
                        transform: 'translateY(-2px)',
                        boxShadow: 'lg',
                      }}
                      _active={{
                        bg: '#B3002F',
                        transform: 'translateY(0)',
                      }}
                      _disabled={{
                        bg: 'gray.300',
                        cursor: 'not-allowed',
                        _hover: {
                          bg: 'gray.300',
                          transform: 'none',
                          boxShadow: 'none',
                        }
                      }}
                      transition="all 0.2s"
                    >
                      Continue
                    </Button>
                  </>
                ) : step === 'audience' ? (
                  <>
                    <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600">
                      Who are you?
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={8}>
                      Your role helps us provide the most relevant and compliant experience.
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderWidth="2px"
                        height="110px"
                        borderRadius="xl"
                        color="gray.700"
                        onClick={() => setStep('patient')}
                        _hover={{
                          borderColor: '#CE0037',
                          bg: 'red.50',
                          color: '#CE0037',
                          transform: 'translateY(-4px)',
                          shadow: 'xl',
                        }}
                        transition="all 0.3s"
                        fontSize="md"
                        fontWeight="600"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        A Patient or Consumer
                      </Button>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderWidth="2px"
                        height="110px"
                        borderRadius="xl"
                        color="gray.700"
                        onClick={() => setStep('family')}
                        _hover={{
                          borderColor: '#CE0037',
                          bg: 'red.50',
                          color: '#CE0037',
                          transform: 'translateY(-4px)',
                          shadow: 'xl',
                        }}
                        transition="all 0.3s"
                        fontSize="md"
                        fontWeight="600"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        A Friend, Caregiver or Family
                      </Button>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderWidth="2px"
                        height="110px"
                        borderRadius="xl"
                        color="gray.700"
                        onClick={() => setStep('hcp')}
                        _hover={{
                          borderColor: '#CE0037',
                          bg: 'red.50',
                          color: '#CE0037',
                          transform: 'translateY(-4px)',
                          shadow: 'xl',
                        }}
                        transition="all 0.3s"
                        fontSize="md"
                        fontWeight="600"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        A Healthcare Professional
                      </Button>
                    </SimpleGrid>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      color="gray.600"
                      mb={4}
                      onClick={() => setStep('audience')}
                      fontSize="sm"
                    >
                      ← Back
                    </Button>
                    {/* Redundant check removed as hcp is handled top-level */}
                  </>
                )}
              </Box>

            </Flex>
          </CardBody>
        </Card>
      </Flex>

      {/* Footer */}
      <Box
        as="footer"
        py={5}
        px={6}
        textAlign="center"
        fontSize="sm"
        color="gray.600"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
      >
        <Text lineHeight="tall">
          Thank you for helping us make our products safer and more effective for everyone,
          everywhere.
        </Text>
      </Box>
    </Flex>
  );
}

export default WelcomePage;