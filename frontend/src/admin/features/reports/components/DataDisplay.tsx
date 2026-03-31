import { Box, Flex, Text, SimpleGrid, VStack, Image, Badge } from "@chakra-ui/react";

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isPrimitive(val: any) {
  return typeof val === "string" || typeof val === "number" || typeof val === "boolean";
}

// ── Recursive DataDisplay ──────────────────────────────────────────────────────
export const DataDisplay = ({ data, depth = 0 }: { data: any; depth?: number }): any => {
  if (data === null || data === undefined) return null;

  // Primitive leaf value
  if (isPrimitive(data)) {
    const str = data.toString();
    // Check for base64 image or data URL
    if (typeof data === "string" && (data.startsWith("data:image/") || (data.length > 50 && data.includes(";base64,")))) {
      return (
        <Box 
          mt={2} 
          borderRadius="lg" 
          overflow="hidden" 
          border="1px solid" 
          borderColor="#e2e8f0" 
          maxW="400px" 
          boxShadow="sm"
          cursor="zoom-in"
          transition="all 0.2s"
          _hover={{ transform: "scale(1.01)", borderColor: "#CE0037" }}
          onClick={() => {
            (window as any).__zoomImage?.(data);
          }}
        >
          <Image
              src={data}
              alt="Attachment Preview"
              w="100%"
              h="auto"
              display="block"
              fallback={<Text fontSize="xs" color="gray.500" p={2}>Unable to load image preview</Text>}
            />
        </Box>
      );
    } 
    return (
      <Text as="span" fontSize="sm" color="#0f172a" fontWeight="500">
        {str}
      </Text>
    );
  }

  // Array
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    const allPrimitive = data.every(isPrimitive);
    if (allPrimitive) {
      // Check if any item looks like a base64 image
      const hasImages = data.some(item => typeof item === "string" && (item.startsWith("data:image/") || (item.length > 50 && item.includes(";base64,"))));
      
      if (hasImages) {
        return (
          <Flex wrap="wrap" gap={3} mt={2}>
            {data.map((item, i) => (
              <DataDisplay key={i} data={item} depth={depth + 1} />
            ))}
          </Flex>
        );
      }

      // Render as pill-badges for normal text
      return (
        <Flex wrap="wrap" gap={1.5} mt={1}>
          {data.map((item, i) => (
            <Badge
              key={i}
              bg="#f1f5f9"
              color="#334155"
              borderRadius="md"
              px={2}
              py={0.5}
              fontSize="xs"
              fontWeight="medium"
              textTransform="none"
              border="1px solid #e2e8f0"
            >
              {item.toString()}
            </Badge>
          ))}
        </Flex>
      );
    }
    // Array of objects/arrays — numbered cards
    return (
      <VStack align="stretch" spacing={2} mt={2} w="full">
        {data.map((item, i) => (
          <Box
            key={i}
            bg="white"
            borderRadius="lg"
            p={3}
            border="1px solid #e2e8f0"
            borderLeft="3px solid #CE0037"
          >
            {data.length > 1 && (
              <Text fontSize="2xs" color="#CE0037" fontWeight="800" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
                Entry {i + 1}
              </Text>
            )}
            <DataDisplay data={item} depth={depth + 1} />
          </Box>
        ))}
      </VStack>
    );
  }

  // Object
  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data).filter((k) => {
      const v = data[k];
      return (
        v !== null &&
        v !== undefined &&
        v !== "" &&
        k !== "xmlUrl" &&
        k !== "pdfUrl" &&
        k !== "isValid" &&
        k !== "validationErrors" &&
        !(Array.isArray(v) && v.length === 0) &&
        !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
      );
    });

    const flatKeys = keys.filter((k) => isPrimitive(data[k]));
    const nestedKeys = keys.filter((k) => !isPrimitive(data[k]));

    return (
      <VStack align="stretch" spacing={0} w="full">
        {/* Flat primitive fields — clean 2-column label/value grid */}
        {flatKeys.length > 0 && (
          <SimpleGrid
            columns={2}
            spacing={0}
            mb={nestedKeys.length > 0 ? 4 : 0}
          >
            {flatKeys.map((key) => (
              <Box
                key={key}
                py={2.5}
                pr={4}
                borderBottom="1px solid #f1f5f9"
              >
                <Text
                  fontSize="2xs"
                  color="#94a3b8"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.06em"
                  mb={0.5}
                >
                  {formatKey(key)}
                </Text>
                <DataDisplay data={data[key]} depth={depth + 1} />
              </Box>
            ))}
          </SimpleGrid>
        )}

        {/* Nested fields — labeled expandable sections */}
        {nestedKeys.map((key) => (
          <Box key={key} mb={4}>
            {/* Section header with red accent bar */}
            <Flex align="center" gap={2} mb={2.5}>
              <Box w="3px" h="14px" bg="#CE0037" borderRadius="full" flexShrink={0} />
              <Text
                fontSize="xs"
                color="#475569"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.07em"
              >
                {formatKey(key)}
              </Text>
              <Box flex={1} h="1px" bg="#f1f5f9" />
            </Flex>
            {/* Indented content */}
            <Box pl={4} borderLeft="2px solid #f1f5f9">
              <DataDisplay data={data[key]} depth={depth + 1} />
            </Box>
          </Box>
        ))}
      </VStack>
    );
  }

  return null;
};
