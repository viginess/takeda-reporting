import { Box, Flex, Heading, Text, Link as ChakraLink, Image, HStack, Container, VStack, Divider, FormControl, FormLabel, Input, Textarea, Button, useToast, Select, Alert, AlertIcon, AlertDescription, SimpleGrid } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { countries } from '../../utils/countries';

const ContactPage = () => {
    const { t, i18n } = useTranslation();
    const isRTLValue = i18n.dir() === 'rtl';
    const toast = useToast();

    const [formData, setFormData] = useState({
        title: 'mr',
        firstName: '',
        lastName: '',
        email: '',
        country: '',
        inquiryType: 'general',
        message: ''
    });

    const submitContact = trpc.contact.submitContactForm.useMutation({
        onSuccess: () => {
            toast({
                title: "Inquiry Sent",
                description: "Thank you for your message. We will get back to you shortly.",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            });
            setFormData({
                title: 'mr',
                firstName: '',
                lastName: '',
                email: '',
                country: '',
                inquiryType: 'general',
                message: ''
            });
        },
        onError: (err) => {
            toast({
                title: "Submission Failed",
                description: err.message || "Failed to send your message. Please try again later.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            });
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        submitContact.mutate(formData);
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Flex direction="column" minH="100vh" bg="gray.50" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
            {/* Header */}
            <Flex as="header" align="center" justify="space-between" px={{ base: 4, md: 12 }} py={5} bg="white" boxShadow="sm" borderBottom="1px solid" borderColor="gray.100">
                <Link to="/">
                    <Image src={logo} alt="Clin Solutions L.L.C." h={{ base: "32px", md: "48px" }} cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                </Link>
                <HStack spacing={4}>
                    <ChakraLink as={Link} to="/" display="flex" alignItems="center" color="gray.600" _hover={{ color: '#CE0037' }}>
                        <ChevronLeft size={20} />
                        <Text ml={1} fontWeight="500" display={{ base: "none", sm: "block" }}>{t('common.back', 'Back to Home')}</Text>
                    </ChakraLink>
                </HStack>
            </Flex>

            {/* Main Content */}
            <Box flex="1" py={{ base: 4, md: 10 }} px={{ base: 2, md: 4 }}>
                <Container maxW="container.lg" bg="white" p={{ base: 6, md: 10 }} borderRadius="2xl" boxShadow="xl" dir={isRTLValue ? 'rtl' : 'ltr'}>
                    <VStack align="stretch" spacing={8}>
                        <VStack align="flex-start" spacing={2}>
                            <Heading as="h1" size="xl" color="#CE0037">Contact Us</Heading>
                            <Text color="gray.600" fontSize="lg">
                                How can we help you? Please choose the appropriate category for your inquiry.
                            </Text>
                        </VStack>

                        <Alert status="error" variant="left-accent" borderRadius="md" bg="red.50" borderColor="#CE0037">
                            <AlertIcon color="#CE0037" />
                            <AlertDescription fontSize="sm" color="gray.800">
                                <Text fontWeight="bold" display="inline">Emergency Reporting:</Text> If you wish to report a side effect or quality complaint, please select the **"Pharmacovigilance / Side Effect Report"** option under Inquiry Type for prioritized handling.
                            </AlertDescription>
                        </Alert>

                        <Divider />
                        
                        <Box as="form" onSubmit={handleSubmit}>
                            <VStack spacing={6} align="stretch">
                                <HStack spacing={4} flexWrap="wrap">
                                    <FormControl isRequired w={{ base: 'full', md: '120px' }}>
                                        <FormLabel fontSize="sm" fontWeight="600">Title</FormLabel>
                                        <Select 
                                            bg="white" 
                                            borderColor="gray.300"
                                            value={formData.title}
                                            onChange={(e) => handleChange('title', e.target.value)}
                                        >
                                            <option value="mr">Mr.</option>
                                            <option value="ms">Ms.</option>
                                            <option value="mx">Mx.</option>
                                            <option value="dr">Dr.</option>
                                            <option value="other">Other</option>
                                        </Select>
                                    </FormControl>
                                    <FormControl isRequired flex="1" minW="200px">
                                        <FormLabel fontSize="sm" fontWeight="600">First Name</FormLabel>
                                        <Input 
                                            bg="white" 
                                            borderColor="gray.300" 
                                            placeholder="e.g. John" 
                                            value={formData.firstName}
                                            onChange={(e) => handleChange('firstName', e.target.value)}
                                        />
                                    </FormControl>
                                    <FormControl isRequired flex="1" minW="200px">
                                        <FormLabel fontSize="sm" fontWeight="600">Surname</FormLabel>
                                        <Input 
                                            bg="white" 
                                            borderColor="gray.300" 
                                            placeholder="e.g. Doe" 
                                            value={formData.lastName}
                                            onChange={(e) => handleChange('lastName', e.target.value)}
                                        />
                                    </FormControl>
                                </HStack>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                    <FormControl isRequired>
                                        <FormLabel fontSize="sm" fontWeight="600">Email Address</FormLabel>
                                        <Input 
                                            bg="white" 
                                            borderColor="gray.300" 
                                            type="email" 
                                            placeholder="john.doe@example.com" 
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                        />
                                    </FormControl>
                                    <FormControl isRequired>
                                        <FormLabel fontSize="sm" fontWeight="600">Country / Region</FormLabel>
                                        <Select 
                                            bg="white" 
                                            borderColor="gray.300" 
                                            placeholder="Select your country"
                                            value={formData.country}
                                            onChange={(e) => handleChange('country', e.target.value)}
                                        >
                                            {countries.map((c) => (
                                                <option key={c.code} value={c.name}>{c.name}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </SimpleGrid>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Inquiry Type</FormLabel>
                                    <Select 
                                        bg="white" 
                                        borderColor="gray.300" 
                                        fontWeight="500"
                                        value={formData.inquiryType}
                                        onChange={(e) => handleChange('inquiryType', e.target.value)}
                                    >
                                        <option value="general">General Corporate Inquiry</option>
                                        <option value="pv">Pharmacovigilance / Side Effect Report</option>
                                        <option value="career">Job Applications / Careers</option>
                                        <option value="privacy">Privacy / Data Subject Request</option>
                                        <option value="technical">Technical Support</option>
                                    </Select>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Message</FormLabel>
                                    <Textarea 
                                        bg="white" 
                                        borderColor="gray.300" 
                                        placeholder="Please describe your inquiry in detail..." 
                                        h="150px" 
                                        value={formData.message}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                    />
                                </FormControl>

                                <Button 
                                    type="submit" 
                                    bg="#CE0037" 
                                    color="white" 
                                    size="lg" 
                                    _hover={{ bg: '#A3002C', transform: 'translateY(-2px)', shadow: 'xl' }} 
                                    transition="all 0.3s" 
                                    alignSelf={{ base: 'stretch', md: 'flex-start' }} 
                                    px={12}
                                    fontWeight="bold"
                                    letterSpacing="wide"
                                    isLoading={submitContact.isPending}
                                >
                                    SEND MESSAGE
                                </Button>
                            </VStack>
                        </Box>


                        <Divider mt={4} />
                        <Box color="gray.700" fontSize="sm">
                            <Text fontWeight="bold">Corporate Office:</Text>
                            <Text>Clin Solutions L.L.C.</Text>
                            <Text>Email: aereporting@viginess.com</Text>
                        </Box>
                    </VStack>
                </Container>
            </Box>

            {/* Footer */}
            <Box as="footer" py={5} px={6} textAlign="center" fontSize="sm" color="gray.600" bg="white" borderTop="1px solid" borderColor="gray.200">
                <Text>{t('welcome.footer', '© 2024 Clin Solutions L.L.C. All rights reserved.')}</Text>
            </Box>
        </Flex>
    );
};

export default ContactPage;
