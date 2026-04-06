import { Box, Flex, Heading, Text, Link as ChakraLink, Image, HStack, Container, VStack, Divider, UnorderedList, ListItem } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import { ChevronLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
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
                <Container maxW="container.lg" bg="white" p={{ base: 5, md: 8 }} borderRadius="xl" boxShadow="md" dir={isRTLValue ? 'rtl' : 'ltr'}>
                    <VStack align="stretch" spacing={6}>
                        <Heading as="h1" size="xl" color="#CE0037">Privacy Statement</Heading>
                        <Text fontSize="sm" color="gray.500">Last updated: {new Date().toLocaleDateString()}</Text>
                        <Divider />
                        
                        <Box color="gray.700" lineHeight="tall" css={{ '& h2, & h3, & h4': { marginTop: '24px', marginBottom: '16px', fontWeight: 'bold' }, '& p': { marginBottom: '16px' } }}>
                            <Text>
                                This website (hereinafter the “Website“) is provided by Clin Solutions L.L.C. (hereinafter “us” or “we”). For further information regarding the provider of the Website, please refer to <ChakraLink as={Link} color="#CE0037" to="/imprint">our imprint</ChakraLink>.
                            </Text>

                            <Text>
                                Information on other selected non-Website related data processing activities performed by us and all of our affiliates (e.g. when you give us a business card or we collect your data from publicly available sources) can be found in the <Text as="span" fontWeight="bold" color="#CE0037">privacy information for selected specific processing activities</Text>.
                            </Text>

                            <Text>
                                Supplemental data privacy information for specific countries and/or regions where Clin Solutions is active is also available. For further information regarding data privacy in a specific country and/or region, please refer to the provided <Text as="span" fontWeight="bold" color="#CE0037">list of local data privacy statements</Text>.
                            </Text>

                            <Heading as="h2" size="lg">A. Handling of personal data</Heading>
                            <Text>
                                In the following we wish to provide you with information on how we handle your personal data when you use our Website. Unless otherwise indicated in the following chapters, the legal basis for the handling of your personal data results from the fact that such handling is required to make available the functionalities of the Website requested by you (Art. 6(1)(b) General Data Protection Regulation).
                            </Text>

                            <Heading as="h3" size="md">I. Using our Website</Heading>
                            
                            <Heading as="h4" size="sm">1. Accessing our Website</Heading>
                            <Text>
                                When you call up our Website, your browser will transfer certain data to our web server. This is done for technical reasons and required to make available to you the requested information. To facilitate your access to the Website, the following information are collected, briefly stored and used:
                            </Text>
                            <UnorderedList mb={4} pl={4}>
                                <ListItem>IP address</ListItem>
                                <ListItem>Date and time of access</ListItem>
                                <ListItem>Time zone difference to Greenwich Mean Time (GMT)</ListItem>
                                <ListItem>Content of request (specific site)</ListItem>
                                <ListItem>Status of access/HTTP status code</ListItem>
                                <ListItem>Transferred volume of data</ListItem>
                                <ListItem>Website requesting access</ListItem>
                                <ListItem>Browser, language (to load the language version of our site that matches your language setting) and browser software version</ListItem>
                            </UnorderedList>
                            <Text>
                                Moreover, to protect our legitimate interests, we will store such information for a limited period of time in order to be able to initiate a tracking of personal data in the event of actual or attempted unauthorized access to our servers (Art. 6(1)(f) General Data Protection Regulation).
                            </Text>

                            <Heading as="h4" size="sm" mt={4} mb={2}>2. Registration and login</Heading>
                            <Text>
                                In order to be able to use certain services of our Website/App, you need to first register an account with us, where you are able to determine your personal login credentials that you need to be able to log into your personal account. For this registration and subsequent login procedure, we collect the following information about you:
                            </Text>
                            <UnorderedList mb={4} pl={4}>
                                <ListItem>Name and surname</ListItem>
                                <ListItem>Title</ListItem>
                                <ListItem>Academic degree (optional)</ListItem>
                                <ListItem>Profession</ListItem>
                                <ListItem>Employer</ListItem>
                                <ListItem>Contact data (e.g. postal/E-Mail address or phone number)</ListItem>
                                <ListItem>User name and password</ListItem>
                                <ListItem>Log file of your logins incl. Timestamp</ListItem>
                                <ListItem>Language used for the Website/App</ListItem>
                                <ListItem>Your status as a healthcare professional (optional)</ListItem>
                            </UnorderedList>
                            <Text>
                                Moreover, we store the dates and times of your logins to your personal account in order to maintain its security. The legal basis for the processing of your personal data is the performance of the contract (Art. 6(1)(b) General Data Protection Regulation) or, as the case may be, your consent (Art. 6(1)(a) General Data Protection Regulation).
                            </Text>
                            <Text>
                                If you do not provide this information, you will not be able to use the respective services. They are deleted in case you deactivate your user account or if the purpose for which it was collected no longer exists.
                            </Text>

                            <Heading as="h4" size="sm">3. Setting of cookies</Heading>
                            
                            <Text fontWeight="bold">a) What are cookies?</Text>
                            <Text>
                                This Website uses so-called “cookies”. Cookies are small text files that are stored in the memory of your terminal via your browser. They store certain information (e.g. your preferred language or site settings) which your browser may (depending on the lifespan of the cookie) retransmit to us upon your next visit to our Website.
                            </Text>

                            <Text fontWeight="bold">b) What cookies do we use?</Text>
                            <Text>
                                We differentiate between two main-categories of cookies: (1) functional cookies, without which the functionality of our Website would be reduced, and (2) optional cookies (e.g. analytic cookies, targeting cookies, functional cookies) used for e.g. website analysis, website personalization and marketing purposes.
                            </Text>

                            <Text fontWeight="bold">c) Subject to your consent</Text>
                            <Text>
                                We only use optional cookies if we have obtained your prior consent (Art. 6(1)(a) General Data Protection Regulation). Upon your first access to our Website, a banner will appear, asking you to give us your consent to the setting of optional cookies. If your consent is given, we will place a cookie on your computer and the banner will not appear again as long as the cookie is active. After expiration of the cookie’s lifespan, or if you actively delete the cookie, the banner will reappear upon your next visit to our Website and again ask for your consent.
                            </Text>

                            <Text fontWeight="bold">d) How to prevent the setting of cookies</Text>
                            <Text>
                                Of course you may use our Website without any cookies being set. In your browser, you can at any time configure or completely deactivate the use of cookies. This may, however, lead to a restriction of the functions or have adverse effects on the user-friendliness of our Website. You may at any time object to the setting of optional cookies by using the respective objection option indicated in the <Text as="span" fontWeight="bold" color="#CE0037">Privacy Preference Center</Text>.
                            </Text>

                            <Heading as="h4" size="sm">4. Website Analysis</Heading>
                            <Text>
                                We prioritize the privacy of our users. For this reason, we do not utilize third-party website analysis services or marketing trackers that collect personal behavioral data. Our Website is designed to provide you with the information you need without intrusive tracking.
                            </Text>

                            <Heading as="h4" size="sm">5. Use of contact forms</Heading>
                            <Text>
                                You can contact us directly via the <ChakraLink as={Link} color="#CE0037" to="/contact">Contact Page available on our Website</ChakraLink>. In particular, you may provide us with the following information:
                            </Text>
                            <UnorderedList mb={4} pl={4}>
                                <ListItem>Name, surname and title</ListItem>
                                <ListItem>Country</ListItem>
                                <ListItem>Contact data (e.g. postal/e-mail address, phone number)</ListItem>
                                <ListItem>Message</ListItem>
                            </UnorderedList>
                            <Text>
                                We process information provided by you via the contact forms exclusively for the processing of your specific request. For backup/safety reasons, we may store the information provided by you for a limited period of time in order to be able to restore your request in case of any technical issues, but not longer than 6 weeks. Then, we delete the information if it is not required anymore in order to process or follow up on your request.
                            </Text>

                            <Heading as="h4" size="sm">6. Newsletter</Heading>
                            <Text>
                                You can subscribe to our newsletter based on your prior consent. We use a double-opt-in procedure for subscriptions. After you have subscribed to the newsletter on our Website, we will send you a message to the indicated email address asking for your confirmation. If you do not confirm your subscription, your subscription will automatically be deleted. You may revoke your consent and unsubscribe at any time via the link included in each newsletter or by using our <ChakraLink as={Link} color="#CE0037" to="/contact">Contact Page</ChakraLink>.
                            </Text>

                            <Heading as="h4" size="sm">7. Registration for closed user groups</Heading>
                            <Text>
                                Certain information about prescription medicine contained on this Website shall only be made accessible to persons belonging to the circle of medical experts. To verify that you are authorized to access the site, we are therefore obliged to request proof of your status as a medical expert. Once your right of access has been verified, we will create a user account for you in which, in addition to your professional status, we will file the following personal data: Name and surname, User name and password, E-mail address.
                            </Text>
                            <Text>
                                We process this personal data in order to provide you with an access to our website. They are deleted in case you delete your user account.
                            </Text>

                            <Heading as="h4" size="sm">8. Information on side effects and quality complaints</Heading>
                            <Text>
                                This Website is not intended or designed for communications regarding side effects, lack of therapeutic effect, medication errors, medication issues, or quality complaints regarding Clin Solutions products. If you wish to report side effects or make a quality complaint, please contact your health care professional (e.g. physician or pharmacist), your local health authority, or use our specialized <ChakraLink as={Link} color="#CE0037" to="/contact">Contact Page</ChakraLink> provided below for the report of undesirable side effects.
                            </Text>
                            <Text>
                                If you nevertheless report to us undesirable side effects or other issues regarding the safeness or quality of Clin Solutions products, we will be legally bound to deal with your communication and may have to contact you for clarification purposes. Subsequently, we may have to notify the competent health authorities of the issues reported by you. In this context, your information will be forwarded in pseudonymized form, i.e. no information by which you may be directly identified will be passed on.
                            </Text>

                            <Heading as="h4" size="sm">9. User Surveys</Heading>
                            <Text>
                                Participation in the user surveys conducted from time to time on our website is voluntary. We use functional cookies to carry out the user surveys. The technical information recorded by the user survey is the same information that is recorded when users visit the website. Your responses submitted during a user survey will not be linked to your personal data such as your IP address.
                            </Text>

                            <Heading as="h4" size="sm">10. Job Matching Function</Heading>
                            <Text>
                                If you want to make use of the job matching functionality, we need additional application documents, which can be uploaded to the website. An automated algorithm compares the documents you provide with current vacancies at Clin Solutions in order to be able to offer you career opportunities tailored to your needs.
                            </Text>

                            {/* Determination of location removed as per user instruction */}

                            <Heading as="h2" size="lg">II. Transfer of data for commissioned processing</Heading>
                            <Text>
                                For the processing of your personal data we will to some extent use specialized service contractors. Such service contractors are carefully selected and regularly monitored by us. Based on respective data processor agreements, they will only process personal data upon our instruction and strictly in accordance with our directives.
                            </Text>

                            <Heading as="h2" size="lg">III. Processing of personal data outside the EU / the EEA</Heading>
                            <Text>
                                Your personal data will in part also be processed in countries outside the European Union (“EU”) or the European Economic Area (“EEA”), which may have a lower data protection level than European countries. In such cases, we will ensure that a sufficient level of protection is provided for your personal data, e.g. by concluding specific agreements with our contractual partners, or we will ask for your explicit consent to such processing.
                            </Text>

                            <Heading as="h2" size="lg">B. Information regarding your rights</Heading>
                            <Text>
                                The following rights are in general available to you according to applicable data privacy laws:
                            </Text>
                            <UnorderedList mb={4} pl={4}>
                                <ListItem>Right of information about your personal data stored by us;</ListItem>
                                <ListItem>Right to request the correction, deletion or restricted processing of your personal data;</ListItem>
                                <ListItem>Right to object to a processing for reasons of our own legitimate interest, public interest, or profiling;</ListItem>
                                <ListItem>Right to data portability;</ListItem>
                                <ListItem>Right to file a complaint with a data protection authority;</ListItem>
                                <ListItem>You may at any time with future effect withdraw your consent to the collection, processing and use of your personal data.</ListItem>
                            </UnorderedList>

                            <Heading as="h2" size="lg">C. Contact</Heading>
                            <Text mb={4}>
                                For any questions you may have with respect to data privacy, please use our <ChakraLink as={Link} color="#CE0037" to="/contact" fontWeight="bold">dedicated Contact Page</ChakraLink> or contact our company data protection officer at the following address:
                            </Text>

                            <Text fontWeight="bold">
                                Group Data Protection Officer<br/>
                                Clin Solutions L.L.C.<br/>
                            </Text>
                            <Text>
                                Email: privacy@clinsolutions.com
                            </Text>

                            <Heading as="h2" size="lg">D. Amendment of Privacy Statement</Heading>
                            <Text>
                                We may update our Privacy Statement from time to time. Updates of our Privacy Statement will be published on our Website. Any amendments become effective upon publication on our Website. We therefore recommend that you regularly visit the site to keep yourself informed on possible updates.
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

export default PrivacyPolicyPage;
