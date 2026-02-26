import { Flex, Box, Text, Badge } from "@chakra-ui/react";
import { Lock } from "lucide-react";

interface RowItemProps {
  label: string;
  desc?: string;
  children: React.ReactNode;
  sensitive?: boolean;
}

export function RowItem({ label, desc, children, sensitive }: RowItemProps) {
  return (
    <Flex align="center" justify="space-between" py={4} borderBottom="1px solid" borderColor="#f1f5f9">
      <Box flex={1} pr={8}>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" fontWeight="bold" color="#0f172a">{label}</Text>
          {sensitive && (
            <Badge bg="red.50" color="#CE0037" border="1px solid" borderColor="red.200" borderRadius="md" px={1.5} py={0} fontSize="2xs" fontWeight="extrabold" display="flex" alignItems="center" gap={1}>
              <Lock size={8} /> SENSITIVE
            </Badge>
          )}
        </Flex>
        {desc && <Text mt={1} fontSize="xs" color="#64748b" lineHeight="1.5">{desc}</Text>}
      </Box>
      <Box flexShrink={0}>{children}</Box>
    </Flex>
  );
}