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
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useState } from 'react';

import logo from '../../assets/logo.jpg';
import PatientForm from '../patient-report';
import FamilyForm from '../family-report';
import HcpForm from '../hcp-report';
import { countries } from '../../utils/common/countries';
import { languages } from '../../utils/common/languages';
import { useTranslation } from 'react-i18next';
import { useLanguageLoader } from '../../i18n/loader';
import { ChevronLeft } from 'lucide-react';

type Step = 'select' | 'audience' | 'patient' | 'family' | 'hcp';

function WelcomePage() {
  const { t, i18n } = useTranslation();
  const { loadLanguage, isLoading } = useLanguageLoader();
  const [step, setStep] = useState<Step>('select');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('en');

  const isRTLValue = i18n.dir() === 'rtl';

  const handleContinue = () => {
    if (country && language) {
      setStep('audience');
    }
  };

  if (step === 'patient') {
    return <PatientForm countryCode={country} languageCode={language} onBack={() => setStep('audience')} />;
  }

  if (step === 'family') {
    return <FamilyForm countryCode={country} languageCode={language} onBack={() => setStep('audience')} />;
  }

  if (step === 'hcp') {
    return <HcpForm countryCode={country} languageCode={language} onBack={() => setStep('audience')} />;
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
        px={{ base: 4, md: 8, lg: 12 }}
        py={5}
        bg="white"
        boxShadow="sm"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Link href="/">
          <Image src={logo} alt="Clin Solutions L.L.C." h={{ base: "36px", md: "48px" }} cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
        </Link>
        <Heading
          as="h1"
          size={{ base: "xs", sm: "sm", md: "md" }}
          fontWeight="600"
          letterSpacing="tight"
          color="gray.800"
          noOfLines={1}
          ml={4}
        >
          {t('welcome.title')}
        </Heading>
      </Flex>

      {/* Main Content */}
      <Flex flex="1" align="center" justify="center" px={{ base: 2, sm: 4 }} py={{ base: 4, md: 8 }}>
        <Card
          maxW="900px"
          w="full"
          bg="white"
          boxShadow="xl"
          borderRadius="xl"
          overflow="hidden"
          mx={{ base: 2, sm: 0 }}
        >
          <CardBody p={0}>
            <Flex direction={{ base: 'column', md: isRTLValue ? 'row-reverse' : 'row' }}>
              {/* Left Side - Branding */}
              <Box
                flex={{ base: '1', md: '0 0 300px' }}
                p={{ base: 6, md: 8 }}
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
                  w={{ base: "80px", md: "120px" }}
                  h={{ base: "80px", md: "120px" }}
                  bg="white"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={{ base: 4, md: 6 }}
                  boxShadow="0 10px 30px rgba(0,0,0,0.2)"
                  position="relative"
                  zIndex={1}
                >
                  <Image src={logo} alt="Clin Solutions L.L.C." h={{ base: "40px", md: "60px" }} w="auto" objectFit="contain" />
                </Box>
                <Heading 
                  as="h2" 
                  size={{ base: "lg", md: "xl" }} 
                  mb={4} 
                  textAlign={isRTLValue ? 'right' : 'center'}
                  fontWeight="700"
                  position="relative"
                  zIndex={1}
                >
                  {t('welcome.welcomeHeading', 'Welcome')}
                </Heading>
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  textAlign={isRTLValue ? 'right' : 'center'}
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
              <Box flex="1" p={{ base: 6, sm: 8, md: 10 }}>
                {step === 'select' ? (
                  <>
                    <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600" textAlign={isRTLValue ? 'right' : 'left'}>
                      {t('welcome.getStarted', 'Get Started')}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={8} textAlign={isRTLValue ? 'right' : 'left'}>
                      {t('welcome.select_country_language', 'Please select your country and preferred language')}
                    </Text>

                    {/* Country Field */}
                    <FormControl mb={6}>
                      <FormLabel fontWeight="600" color="gray.700" mb={2} textAlign={isRTLValue ? 'right' : 'left'}>
                        {t('welcome.country', 'Country')}
                      </FormLabel>
                      <Select
                        placeholder={t('welcome.selectCountry', 'Select country')}
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
                      <FormLabel fontWeight="600" color="gray.700" mb={2} textAlign={isRTLValue ? 'right' : 'left'}>
                        {t('welcome.language', 'Language')}
                      </FormLabel>
                      <Select
                        placeholder={t('welcome.selectLanguage', 'Select language')}
                        size="lg"
                        value={language}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setLanguage(newLang);
                          if (newLang) {
                            loadLanguage(newLang);
                          }
                        }}
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
                      isLoading={isLoading}
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
                      {t('common.continue', 'Continue')}
                    </Button>
                  </>
                ) : step === 'audience' ? (
                  <>
                    <Heading as="h2" size="lg" mb={2} color="gray.800" fontWeight="600" textAlign={isRTLValue ? 'right' : 'left'}>
                      {t('welcome.whoAreYou')}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={8} textAlign={isRTLValue ? 'right' : 'left'}>
                      {t('welcome.roleDescription')}
                    </Text>
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderWidth="2px"
                        height={{ base: "80px", md: "110px" }}
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
                        fontSize={{ base: "sm", md: "md" }}
                        fontWeight="600"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        {t('welcome.roles.patient')}
                      </Button>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderWidth="2px"
                        height={{ base: "80px", md: "110px" }}
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
                        fontSize={{ base: "sm", md: "md" }}
                        fontWeight="600"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        {t('welcome.roles.family')}
                      </Button>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderWidth="2px"
                        height={{ base: "80px", md: "110px" }}
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
                        fontSize={{ base: "sm", md: "md" }}
                        fontWeight="600"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        {t('welcome.roles.hcp')}
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
                      leftIcon={<ChevronLeft size={16} />}
                    >
                      {t('common.back', 'Back')}
                    </Button>
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
        <Text lineHeight="tall" mb={4}>
          {t('welcome.footer')}
        </Text>
        <Wrap justify="center" spacing={{ base: 2, md: 4 }} align="center">
          <WrapItem>
            <Link href="/privacy-policy" color="gray.500" _hover={{ color: '#CE0037' }}>
              Privacy Policy
            </Link>
          </WrapItem>
          <WrapItem display={{ base: 'none', sm: 'block' }}>
            <Text color="gray.300">|</Text>
          </WrapItem>
          <WrapItem>
            <Link href="/terms-conditions" color="gray.500" _hover={{ color: '#CE0037' }}>
              Terms & Conditions
            </Link>
          </WrapItem>
          <WrapItem display={{ base: 'none', sm: 'block' }}>
            <Text color="gray.300">|</Text>
          </WrapItem>
          <WrapItem>
            <Link href="/contact" color="gray.500" _hover={{ color: '#CE0037' }}>
              Contact
            </Link>
          </WrapItem>
        </Wrap>
      </Box>
    </Flex>
  );
}

export default WelcomePage;