import { Box, Flex, Heading, Text, Link as ChakraLink, Image, HStack, Container, VStack, Divider } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import { ChevronLeft } from 'lucide-react';

const TermsConditionsPage = () => {
    const isRTLValue = false; // Always LTR for English legal text

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
                        <Text ml={1} fontWeight="500" display={{ base: "none", sm: "block" }}>Back to Home</Text>
                    </ChakraLink>
                </HStack>
            </Flex>

            {/* Main Content */}
            <Box flex="1" py={{ base: 4, md: 10 }} px={{ base: 2, md: 4 }}>
                <Container maxW="container.lg" bg="white" p={{ base: 6, md: 8 }} borderRadius="xl" boxShadow="md" dir={isRTLValue ? 'rtl' : 'ltr'}>
                    <VStack align="stretch" spacing={6}>
                        <Heading as="h1" size="xl" color="#CE0037">Conditions of Use</Heading>
                        <Text fontSize="sm" color="gray.500">Last updated: {new Date().toLocaleDateString()}</Text>
                        <Divider />
                        
                        <Box color="gray.700" lineHeight="tall" css={{ '& h2': { marginTop: '24px', marginBottom: '16px', fontWeight: 'bold' }, '& p': { marginBottom: '16px' } }}>
                            <Text>
                                Access to and use of this website are subject to the following conditions. Please do not use this website unless you agree with these conditions. This website has been developed by Clin Solutions L.L.C. (hereinafter to be referred to as CLIN SOLUTIONS) and is administered by the same. We reserve the right to discontinue or to make partial or complete modifications to this website or to the General Conditions of Use, to our General Terms and Conditions, and to our Conditions of Sale and Delivery. Please note that we may make such changes at our own discretion and without prior announcement. We must therefore ask you, next time you visit this website, to view the conditions again and to note any changes or amendments that may have been made.
                            </Text>

                            <Heading as="h2" size="md">Surrender of Use and Benefit</Heading>
                            <Text>
                                All details, documents and illustrations published on this website are the sole property of CLIN SOLUTIONS. Any permission to use the same is granted on the proviso that the relevant copyright note is displayed on all copies, that such details are only used for personal purposes, that they are not exploited commercially, that the details are not modified in any way and that all illustrations gained from the website are only used in conjunction with the accompanying text.
                            </Text>

                            <Heading as="h2" size="md">Trademarks and Copyright</Heading>
                            <Text>
                                All trademarks on this website are the property of Clin Solutions, unless otherwise noted or in any other way perceivable as third party rights. Any unauthorized use of these trademarks or other materials is expressly prohibited and constitutes a violation of copyright, trademark law or other industrial property rights.
                            </Text>

                            <Heading as="h2" size="md">Limited Liability</Heading>
                            <Text>
                                CLIN SOLUTIONS has compiled the detailed information provided on this website from internal and external sources to the best of its knowledge and belief, using professional diligence. We endeavor to expand and update this range of information on an ongoing basis. The information on this website is purely for the purpose of presenting CLIN SOLUTIONS and its products and services. However, no representation is made or warranty given, either expressly or tacitly, for the completeness or correctness of the information on this website. Please be aware that this information although accurate on the day it was published may no longer be up to date. We therefore recommend that you check any information you obtain from this website prior to using it in whatever form. Advice given on this website does not exempt you from conducting your own checks on our latest advice – particularly our safety datasheets and technical specifications – and on our products, with a view to their suitability for the intended processes and purposes. Should you require any advice or instructions concerning our products or services, please contact us directly. Users of this website declare that they agree to access the website and its content at their own risk. Neither CLIN SOLUTIONS nor third parties involved in the writing, production or transmission of this website can be held liable for damage or injury resulting from access or the impossibility of access or from the use or impossibility of use of this website or from the fact that you have relied on information given on this website.
                            </Text>

                            <Heading as="h2" size="md">Websites of Third-party Vendors/Links</Heading>
                            <Text>
                                This website contains links/references to third-party websites. By providing such links, CLIN SOLUTIONS does not give its approval to their contents. Neither does CLIN SOLUTIONS accept any responsibility for the availability or the contents of such websites or any liability for damage or injury resulting from the use of such contents, of whatever form. CLIN SOLUTIONS offers no guarantee that pages linked to provide information of consistent quality. Links to other websites are provided to website users merely for the sake of convenience. Users access such websites at their own risk. The choice of links should in no way restrict users to the linked pages.
                            </Text>

                            <Heading as="h2" size="md">Details Supplied by Yourself</Heading>
                            <Text>
                                The user of this website is fully responsible for the content and correctness of details he or she sends to CLIN SOLUTIONS as well as for the non-violation of any third-party rights that may be involved in such details. The user gives his or her consent for CLIN SOLUTIONS to store such details and to use the same for the purpose of statistical analysis or for any other specified business purpose, unless the information involves personal details, going beyond master data or usage data as defined in the applicable laws. In particular, CLIN SOLUTIONS is entitled to use the contents of such messages, including ideas, inventions, blueprints, techniques and expertise contained therein, for any purpose, such as the development, production and/or marketing of products or services and to reproduce such information and make it available to third parties without any limitations.
                            </Text>

                            <Heading as="h2" size="md">International Users</Heading>
                            <Text>
                                This website is checked, operated and updated by CLIN SOLUTIONS. It is intended for international use. However CLIN SOLUTIONS gives no guarantee that the details presented on this website are correct worldwide, and, in particular, that products and services will be available with the same appearance, in the same sizes or on the same conditions throughout the world. Should you call up this website or download contents, please note that it is your own responsibility to ensure that you act in compliance with local legislation applicable in that place.
                            </Text>
                            <Text>
                                Products mentioned on this website may come in different packaging, in different package sizes, or with different lettering or markings, depending on the country.
                            </Text>

                            <Heading as="h2" size="md">Sale of CLIN SOLUTIONS Products</Heading>
                            <Text>
                                Our products are sold in accordance with the current version of our General Conditions of Sale and Delivery.
                            </Text>

                            <Heading as="h2" size="md">Applicable Law</Heading>
                            <Text>
                                Any legal claims or lawsuits in conjunction with this website or its use are subject to the interpretation of the applicable laws, except for the provisions of international private law and the Hague Convention relating to a Uniform Law on the International Sale of Goods of July 1, 1964 and in the UN Sales Convention of April 11, 1980.
                            </Text>

                            <Heading as="h2" size="md">Forward-looking Statements</Heading>
                            <Text>
                                This website may contain forward-looking statements based on current assumptions and forecasts made by Clin Solutions management. Various known and unknown risks, uncertainties and other factors could lead to material differences between the actual future results, financial situation, development or performance of the company and the estimates given here. The company assumes no liability whatsoever to update these forward-looking statements or to conform them to future events or developments.
                            </Text>
                        </Box>
                    </VStack>
                </Container>
            </Box>

            {/* Footer */}
            <Box as="footer" py={5} px={6} textAlign="center" fontSize="sm" color="gray.600" bg="white" borderTop="1px solid" borderColor="gray.200">
                <Text>© 2026 Clin Solutions L.L.C. All rights reserved.</Text>
            </Box>
        </Flex>
    );
};

export default TermsConditionsPage;
