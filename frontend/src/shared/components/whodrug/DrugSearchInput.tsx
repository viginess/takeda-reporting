import { useState, useEffect, useRef } from 'react';
import {
  Input,
  List,
  ListItem,
  Box,
  useOutsideClick,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { trpc } from '../../../utils/config/trpc';

interface DrugSearchInputProps {
  value: string;
  onChange: (value: string, code?: string, extra?: any) => void;
  inputStyles?: any;
}

/**
 * High-performance drug search component for WHODrug Global B3.
 * Connects to the backend trigram similarity search API.
 */
export function DrugSearchInput({
  value,
  onChange,
  inputStyles,
}: DrugSearchInputProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Queries the backend search endpoint
  const { data: suggestions, isLoading } = trpc.whodrug.searchDrugs.useQuery(
    { query, limit: 10 },
    { enabled: query.length >= 2 }
  );

  useOutsideClick({
    ref: containerRef,
    handler: () => setIsOpen(false),
  });

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSelect = (item: any) => {
    setQuery(item.name);
    // Emit the selected name, 8-digit regulatory code, and extra data (including manufacturer)
    onChange(item.name, item.code, item);
    setIsOpen(false);
  };

  const handleTextChange = (newText: string) => {
    setQuery(newText);
    setIsOpen(true);
    // Pass the text but NO code — this signals the parent that coding is lost
    // The parent (ProductDetails) decides whether to clear whodrugCode
    onChange(newText, undefined);
  };

  return (
    <Box position="relative" ref={containerRef} w="full">
      <Input
        value={query}
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={t('common.searchDrug', 'Search drug dictionary...')}
        autoComplete="off"
        {...inputStyles}
      />
      {isOpen && (query.length >= 2 || isLoading) && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          boxShadow="xl"
          borderRadius="lg"
          mt={1}
          zIndex={1000}
          maxH="300px"
          overflowY="auto"
          border="1px solid"
          borderColor="gray.100"
        >
          {isLoading ? (
            <ListItem p={4} textAlign="center">
              <Spinner size="sm" color="red.500" />
            </ListItem>
          ) : suggestions && suggestions.length > 0 ? (
            suggestions.map((item: any) => (
              <ListItem
                key={item.rid}
                p={3}
                cursor="pointer"
                _hover={{ bg: 'blue.50', color: 'blue.700' }}
                onClick={() => handleSelect(item)}
                borderBottom="1px solid"
                borderColor="gray.50"
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Text fontWeight="600" fontSize="sm">{item.name}</Text>
                </Box>
                <Box display="flex" mt={1}>
                  <Text fontSize="2xs" color="gray.400" fontWeight="bold">
                    WHODrug Code: {item.code}
                  </Text>
                </Box>
              </ListItem>
            ))
          ) : query.length >= 2 ? (
            <ListItem p={4} color="gray.500" fontSize="xs">
              {t('common.noDrugsFound', 'No drugs found. You can still use your text.')}
            </ListItem>
          ) : null}
        </List>
      )}
    </Box>
  );
}
