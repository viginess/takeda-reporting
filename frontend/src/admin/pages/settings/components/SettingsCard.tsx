import { Card, Flex, Box, Text } from "@chakra-ui/react";

interface SettingsCardProps {
  title: string;
  icon: any;
  children: React.ReactNode;
}

export function SettingsCard({ title, icon: Icon, children }: SettingsCardProps) {
  return (
    <Card bg="white" borderRadius="2xl" border="1px solid" borderColor="#e2e8f0" mb={5} overflow="hidden" boxShadow="none">
      <Flex p={3} px={5} borderBottom="1px solid" borderColor="#f1f5f9" align="center" gap={2} bg="#f8fafc">
        <Icon size={15} color="#CE0037" />
        <Text fontWeight="bold" fontSize="sm" color="#0f172a">{title}</Text>
      </Flex>
      <Box px={5} pb={1}>{children}</Box>
    </Card>
  );
}