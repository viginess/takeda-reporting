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
          position="fixed" bottom="24px" left="50%" transform="translateX(-50%)"
          bg="#0f172a" color="white" borderRadius="2xl" px={6} py={4}
          boxShadow="0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.3)"
          zIndex={1000} display="flex" alignItems="center" gap={6} minW="400px"
        >
          <Flex align="center" gap={3}>
            <Flex bg="#CE0037" borderRadius="full" w="24px" h="24px" align="center" justify="center" fontSize="xs" fontWeight="bold">
              {selectedCount}
            </Flex>
            <Text fontSize="sm" fontWeight="bold">Reports Selected</Text>
          </Flex>
          <Box w="1px" h="24px" bg="whiteAlpha.300" />
          <Flex gap={2}>
            <Button size="sm" variant="outline" color="white" borderColor="whiteAlpha.400"
              _hover={{ bg: "whiteAlpha.200" }} isLoading={downloadingBulk}
              leftIcon={<DownloadCloud size={14} />} onClick={onDownload}>
              Download ZIP
            </Button>
            <Button size="sm" bg="#CE0037" color="white" _hover={{ bg: "#b3002f" }}
              leftIcon={<X size={14} />} onClick={onClear}>
              Clear Selection
            </Button>
          </Flex>
        </Box>
      )}
    </AnimatePresence>
  );
}
