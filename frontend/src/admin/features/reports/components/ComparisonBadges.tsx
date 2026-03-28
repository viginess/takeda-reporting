import { Flex, Box, Badge } from "@chakra-ui/react";
import { type Status, type Severity, statusCfg, severityCfg } from "../types";

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusCfg[status];
  return (
    <Badge
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      bg={cfg.bg}
      color={cfg.text}
      border="1px solid"
      borderColor={cfg.border}
      borderRadius="full"
      px={2.5}
      py={0.5}
      fontSize="2xs"
      fontWeight="bold"
      textTransform="none"
    >
      <cfg.icon size={10} />
      {status}
    </Badge>
  );
}

export function SeverityDot({ severity }: { severity: Severity }) {
  const cfg = severityCfg[severity];
  return (
    <Flex align="center" gap={1.5} fontSize="xs" fontWeight="semibold" color={cfg.color}>
      <Box w="6px" h="6px" borderRadius="full" bg={cfg.color} />
      {severity}
    </Flex>
  );
}

export function ValidationBadge({ isValid, errors }: { isValid?: boolean, errors?: any[] }) {
  const hasErrors = errors && errors.length > 0;
  const valid = isValid !== false && !hasErrors;
  return (
    <Badge
      bg={valid ? "green.50" : "red.50"}
      color={valid ? "emerald.600" : "#CE0037"}
      border="1px solid"
      borderColor={valid ? "green.100" : "red.100"}
      borderRadius="full"
      px={2}
      py={0.5}
      fontSize="2xs"
      fontWeight="bold"
      textTransform="none"
    >
      {valid ? "Valid" : "Invalid"}
    </Badge>
  );
}
