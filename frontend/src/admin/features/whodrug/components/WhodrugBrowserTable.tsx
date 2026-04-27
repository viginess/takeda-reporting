import { Box, Table, Thead, Tbody, Tr, Th, Td, Skeleton, Badge } from "@chakra-ui/react";

interface WhodrugBrowserTableProps {
  searching: boolean;
  searchResults: any[];
  selectedDrugCode: string | null;
  onSelectDrug: (code: string) => void;
  query: string;
}

export function WhodrugBrowserTable({
  searching, searchResults, selectedDrugCode, onSelectDrug, query
}: WhodrugBrowserTableProps) {
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th color="gray.400" fontSize="2xs">Trade Name</Th>
            <Th color="gray.400" fontSize="2xs">Rid Code</Th>
            <Th color="gray.400" fontSize="2xs" isNumeric>Match %</Th>
          </Tr>
        </Thead>
        <Tbody>
          {searching ? (
            [1, 2, 3, 4, 5].map(i => (
              <Tr key={i}><Td colSpan={3}><Skeleton h="30px" borderRadius="md" /></Td></Tr>
            ))
          ) : searchResults?.map((drug: any) => (
            <Tr 
              key={drug.rid} 
              cursor="pointer" 
              _hover={{ bg: "red.50" }} 
              onClick={() => onSelectDrug(drug.code)}
              bg={selectedDrugCode === drug.code ? "red.50" : "transparent"}
            >
              <Td fontWeight="bold" color="#1e293b">{drug.name}</Td>
              <Td><Badge variant="outline" colorScheme="red" fontSize="2xs">{drug.code}</Badge></Td>
              <Td isNumeric color="gray.500" fontSize="xs">{(drug.similarity * 100).toFixed(0)}%</Td>
            </Tr>
          ))}
          {!searching && query.length >= 2 && !searchResults?.length && (
            <Tr><Td colSpan={3} py={10} textAlign="center" color="gray.400">No matching drugs found</Td></Tr>
          )}
          {query.length < 2 && (
            <Tr><Td colSpan={3} py={10} textAlign="center" color="gray.400">Enter at least 2 characters to search</Td></Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
