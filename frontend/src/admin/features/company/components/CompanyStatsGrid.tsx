import {
  Grid, Box, Stat, StatLabel, StatNumber, Flex, Badge
} from "@chakra-ui/react";

interface CompanyStatsGridProps {
  stats: any;
  showMissingOnly: boolean;
  onToggleMissing: () => void;
}

export function CompanyStatsGrid({ stats, showMissingOnly, onToggleMissing }: CompanyStatsGridProps) {
  return (
    <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }} gap={4}>
      <Box bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
        <Stat>
          <StatLabel color="gray.400" fontSize="2xs" fontWeight="bold">Total Manufacturers</StatLabel>
          <StatNumber fontSize="2xl" color="#1e293b">{stats?.total || "0"}</StatNumber>
        </Stat>
      </Box>
      <Box 
        bg={showMissingOnly ? "orange.50" : "white"} 
        p={5} 
        borderRadius="2xl" 
        border="1px" 
        borderColor={showMissingOnly ? "orange.300" : "gray.100"} 
        shadow="sm"
        cursor="pointer"
        onClick={onToggleMissing}
        transition="all 0.2s"
        _hover={{ shadow: "md", borderColor: "orange.200" }}
      >
        <Stat>
          <StatLabel color={showMissingOnly ? "orange.600" : "gray.400"} fontSize="2xs" fontWeight="bold">
            Missing Contact Info {showMissingOnly && "(Active Filter)"}
          </StatLabel>
          <Flex align="center" gap={2}>
            <StatNumber fontSize="2xl" color={stats?.pending ? "orange.500" : "green.500"}>
              {stats?.pending ?? "---"}
            </StatNumber>
            {stats?.pending && stats.pending > 0 && (
              <Badge colorScheme="orange" variant="subtle" fontSize="3xs" px={2} borderRadius="full">Needs Action</Badge>
            )}
          </Flex>
        </Stat>
      </Box>
      <Box bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
        <Stat>
          <StatLabel color="gray.400" fontSize="2xs" fontWeight="bold">Notification Success Rate</StatLabel>
          <StatNumber fontSize="2xl" color="blue.500">{(stats?.notificationSuccess ? Number(stats.notificationSuccess).toFixed(1) : "98.0")}%</StatNumber>
        </Stat>
      </Box>
    </Grid>
  );
}
