import { Grid, Box, Stat, StatLabel, StatNumber, Flex, Skeleton } from "@chakra-ui/react";
import { Database, Layers, Info } from "lucide-react";

interface WhodrugSummaryStatsProps {
  stats: any;
  loadingStats: boolean;
}

export function WhodrugSummaryStats({ stats, loadingStats }: WhodrugSummaryStatsProps) {
  return (
    <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }} gap={4}>
      <SummaryStat label="Medicinal Products" value={stats?.counts.medicinalProducts} icon={Database} isLoading={loadingStats} />
      <SummaryStat label="Active Ingredients" value={stats?.counts.ingredients} icon={Layers} isLoading={loadingStats} />
      <SummaryStat label="Dictionary Version" value={stats?.version} icon={Info} isLoading={loadingStats} isText />
    </Grid>
  );
}

function SummaryStat({ label, value, icon: Icon, isLoading, isText }: any) {
  return (
    <Stat bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
      <Flex justify="space-between" align="center" mb={1}>
        <StatLabel color="gray.500" fontSize="2xs" fontWeight="extrabold" textTransform="uppercase" letterSpacing="0.1em">{label}</StatLabel>
        <Box p={2} bg="red.50" borderRadius="xl"><Icon size={14} color="#CE0037" /></Box>
      </Flex>
      {isLoading ? (
        <Skeleton h="30px" w="100px" mt={2} />
      ) : (
        <StatNumber color="#1e293b" fontSize={isText ? "md" : "2xl"}>
          {isText ? value : (value?.toLocaleString() || "0")}
        </StatNumber>
      )}
    </Stat>
  );
}
