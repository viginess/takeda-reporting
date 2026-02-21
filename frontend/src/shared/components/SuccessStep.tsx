import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  HStack,
  Link,
  useToast,
} from '@chakra-ui/react';
import { LuBadgeCheck } from "react-icons/lu";
import { FaRegCopy } from "react-icons/fa6";

interface SuccessStepProps {
  onBackToHome?: () => void;
  onSubmitAnother?: () => void;
  reportId?: string;
}

export function SuccessStep({ onBackToHome, onSubmitAnother, reportId }: SuccessStepProps) {
  const toast = useToast();
  const displayId = reportId ?? `REP-${String(Date.now()).slice(-8)}`;


  const handleCopy = () => {
    navigator.clipboard.writeText(displayId);
    toast({
      title: "Report ID copied!",
      status: "success",
      duration: 2000,
    });
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={16}
      px={6}
      textAlign="center"
      maxW="650px"
      mx="auto"
    >
      {/* Green Success Box */}
      <Box
        w="full"
        bg="green.50"
        border="1px solid"
        borderColor="green.200"
        borderRadius="xl"
        p={10}
        boxShadow="sm"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          bg: 'green.400',
          borderTopRadius: 'xl',
        }}
      >
        {/* Success Icon */}
        <Box
          w="80px"
          h="80px"
          bg="green.500"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={6}
          boxShadow="0 4px 16px rgba(16, 185, 129, 0.25)"
        >
          <LuBadgeCheck size={52} color="white" strokeWidth={1.5} />
        </Box>

        {/* Heading */}
        <Heading 
          size="lg" 
          mb={3} 
          color="green.900"
          fontWeight="600"
        >
          Report Submitted Successfully
        </Heading>

        {/* Description */}
        <Text 
          fontSize="md" 
          color="green.700" 
          mb={8} 
          lineHeight="1.7"
          maxW="500px"
          mx="auto"
        >
          Thank you for helping us make our products safer and more effective for everyone.
          Your report has been successfully received and will be reviewed by our team.
        </Text>

        {/* Report Number with Copy Icon */}
        <Box
          p={4}
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="green.200"
          display="inline-flex"
          alignItems="center"
          gap={3}
          mx="auto"
        >
          <Text 
            fontSize="lg" 
            color="green.900" 
            fontWeight="700" 
            fontFamily="mono"
            letterSpacing="1px"
          >
            {displayId}
          </Text>
          <Box
            as="button"
            color="green.600"
            _hover={{ color: 'green.700' }}
            cursor="pointer"
            display="flex"
            alignItems="center"
            onClick={handleCopy}
          >
            <FaRegCopy size={16} />
          </Box>
        </Box>
      </Box>

      {/* Horizontal Action Buttons */}
      <HStack spacing={4} mt={8} flexWrap="wrap" justify="center">
        <Button
          bg="#CE0037"
          color="white"
          fontWeight={600}
          borderRadius="lg"
          size="lg"
          h="56px"
          px={8}
          fontSize="md"
          _hover={{ bg: '#B8002F' }}
          onClick={onSubmitAnother}
        >
          Submit Another Report
        </Button>

        <Button
          as={Link}
          href="/"
          variant="outline"
          borderColor="gray.300"
          color="gray.700"
          fontWeight={500}
          borderRadius="lg"
          size="lg"
          h="56px"
          px={8}
          fontSize="md"
          _hover={{
            bg: 'gray.50',
            borderColor: 'gray.400',
            textDecoration: 'none',
          }}
          onClick={onBackToHome}
        >
          Back to Home
        </Button>
      </HStack>

      {/* Support Contact */}
      <Text 
        fontSize="sm" 
        color="gray.500" 
        mt={8}
        maxW="450px"
      >
        Questions? Contact us at{' '}
        <Text as="span" color="#CE0037" fontWeight="600">
          support@company.com
        </Text>
      </Text>
    </Flex>
  );
}
