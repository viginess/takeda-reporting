import { motion, AnimatePresence } from "framer-motion";
import { DownloadCloud, X } from "lucide-react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";

interface BulkToolbarProps {
  selectedCount: number;
  downloadingBulk: boolean;
  onDownload: () => void;
  onClear: () => void;
}

export function BulkToolbar({ selectedCount, downloadingBulk, onDownload, onClear }: BulkToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <Box
          as={motion.div as any}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          position="fixed" 
          bottom={{ base: "16px", sm: "24px" }}
          left={{ base: "16px", sm: "50%" }}
          right={{ base: "16px", sm: "auto" }}
          transform={{ base: "none", sm: "translateX(-50%)" }}
          bg="#0f172a" 
          color="white" 
          borderRadius="2xl" 
          px={{ base: 4, sm: 6 }} 
          py={{ base: 4, sm: 4 }}
          boxShadow="0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.3)"
          zIndex={1000} 
          display="flex" 
          flexDirection={{ base: "column", sm: "row" }}
          alignItems="center" 
          gap={{ base: 4, sm: 6 }} 
          w={{ base: "auto", sm: "auto" }}
          maxW="500px"
        >
          <Flex align="center" gap={3} w={{ base: "full", sm: "auto" }} justify={{ base: "center", sm: "flex-start" }}>
            <Flex bg="#CE0037" borderRadius="full" minW="24px" h="24px" align="center" justify="center" fontSize="xs" fontWeight="bold" flexShrink={0}>
              {selectedCount}
            </Flex>
            <Text fontSize="sm" fontWeight="extrabold" letterSpacing="tight">
              {selectedCount === 1 ? "1 Report Selected" : `${selectedCount} Reports Selected`}
            </Text>
          </Flex>

          <Box display={{ base: "none", sm: "block" }} w="1px" h="24px" bg="whiteAlpha.300" />
          
          <Flex gap={2} w={{ base: "full", sm: "auto" }} flexDirection={{ base: "column", sm: "row" }}>
            <Button 
              w={{ base: "full", sm: "auto" }}
              size="sm" 
              variant="outline" 
              color="white" 
              borderColor="whiteAlpha.400"
              _hover={{ bg: "whiteAlpha.200" }} 
              isLoading={downloadingBulk}
              leftIcon={<DownloadCloud size={14} />} 
              onClick={onDownload}
              fontSize="xs"
              h={{ base: "40px", sm: "32px" }}
            >
              Download
            </Button>
            <Button 
              w={{ base: "full", sm: "auto" }}
              size="sm" 
              bg="#CE0037" 
              color="white" 
              _hover={{ bg: "#b3002f" }}
              leftIcon={<X size={14} />} 
              onClick={onClear}
              fontSize="xs"
              h={{ base: "40px", sm: "32px" }}
            >
              Clear
            </Button>
          </Flex>
        </Box>
      )}
    </AnimatePresence>
  );
}
