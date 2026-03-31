import { Box, Flex, Heading, Text, Link as ChakraLink, Image, HStack, Container, VStack, Divider } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import { ChevronLeft } from 'lucide-react';

const ImprintPage = () => {
    const isRTLValue = false; // Always LTR for English legal text

    return (
        <Flex direction="column" minH="100vh" bg="gray.50" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
            {/* Header */}
            <Flex as="header" align="center" justify="space-between" px={12} py={5} bg="white" boxShadow="sm" borderBottom="1px solid" borderColor="gray.100">
                <Link to="/">
                    <Image src={logo} alt="Clin Solutions L.L.C." h="48px" cursor="pointer" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                </Link>
                <HStack spacing={4}>
                    <ChakraLink as={Link} to="/" display="flex" alignItems="center" color="gray.600" _hover={{ color: '#CE0037' }}>
                        <ChevronLeft size={20} />
                        <Text ml={1} fontWeight="500">Back to Home</Text>
                    </ChakraLink>
                </HStack>
            </Flex>

            {/* Main Content */}
            <Box flex="1" py={10} px={4}>
                <Container maxW="container.lg" bg="white" p={8} borderRadius="xl" boxShadow="md" dir={isRTLValue ? 'rtl' : 'ltr'}>
                    <VStack align="stretch" spacing={6}>
                        <Heading as="h1" size="xl" color="#CE0037">Imprint</Heading>
                        <Divider />
                        
                        <Box color="gray.700" lineHeight="tall">
                            <Heading as="h2" size="md" mb={4}>Clin Solutions L.L.C.</Heading>
                            
                            <Text fontWeight="bold" mt={4}>Address:</Text>
                            <Text>Clin Solutions L.L.C.</Text>
                            <Text>Corporate Headquarters</Text>
                            <Text>Germany / International Offices</Text>
                            
                            <Text fontWeight="bold" mt={4}>Contact Information:</Text>
                            <Text><strong>E-Mail:</strong> <ChakraLink href="mailto:aereporting@viginess.com" color="#CE0037">aereporting@viginess.com</ChakraLink></Text>
                            <Text>Website: www.clinsolutions.com</Text>

                            <Text fontWeight="bold" mt={4}>Represented by:</Text>
                            <Text>Management Board</Text>

                            <Text fontWeight="bold" mt={4}>Registration:</Text>
                            <Text>Registered in the Commercial Register.</Text>
                            <Text>Registration Number: [Pending]</Text>

                            <Text fontWeight="bold" mt={4}>VAT Identification Number:</Text>
                            <Text>VAT ID: [Pending]</Text>

                            <Text fontWeight="bold" mt={4}>Disclaimer:</Text>
                            <Text mt={2}>
                                The contents of our pages have been created with the utmost care. However, we cannot guarantee the contents' accuracy, completeness or topicality. According to statutory provisions, we are furthermore responsible for our own content on these web pages.
                            </Text>
                        </Box>
                    </VStack>
                </Container>
            </Box>

            {/* Footer */}
            <Box as="footer" py={5} px={6} textAlign="center" fontSize="sm" color="gray.600" bg="white" borderTop="1px solid" borderColor="gray.200">
                <Text>© 2024 Clin Solutions L.L.C. All rights reserved.</Text>
            </Box>
        </Flex>
    );
};

export default ImprintPage;
