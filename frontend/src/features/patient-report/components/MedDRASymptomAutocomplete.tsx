
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
import { trpc } from '../../../utils/trpc';

interface MedDRASymptomAutocompleteProps {
  value: string;
  onChange: (value: string, code?: string, extra?: any) => void;
  inputStyles: any;
}

export function MedDRASymptomAutocomplete({
  value,
  onChange,
  inputStyles,
}: MedDRASymptomAutocompleteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = trpc.reference.searchMeddra.useQuery(
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
    setQuery(item.term);
    onChange(item.term, item.code, item);
    setIsOpen(false);
  };

  return (
    <Box position="relative" ref={containerRef} w="full">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={t('forms.patient.eventDetails.symptomPlaceholder', 'Type symptom (e.g. Headache, Nausea)...')}
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
          boxShadow="lg"
          borderRadius="md"
          mt={1}
          zIndex={1000}
          maxH="250px"
          overflowY="auto"
          border="1px solid"
          borderColor="gray.200"
        >

          {isLoading ? (
            <ListItem p={4} textAlign="center">
              <Spinner size="sm" color="red.500" />
            </ListItem>
          ) : suggestions && suggestions.length > 0 ? (
            suggestions.map((item: any, idx: number) => (
              <ListItem
                key={item.code || `suggestion-${idx}`}
                p={3}
                cursor="pointer"
                _hover={{ bg: 'red.50', color: 'red.700' }}
                onClick={() => handleSelect(item)}
                borderBottom="1px solid"
                borderColor="gray.50"
              >
                <Text fontWeight="600">{item.term}</Text>
                {item.description && (
                  <Text fontSize="xs" color="gray.600" mb={1} fontStyle="italic">
                    {item.description}
                  </Text>
                )}
                <Text fontSize="2xs" color="gray.400" fontWeight="bold">
                  MedDRA Code: {item.code || 'N/A'}
                </Text>
              </ListItem>
            ))
          ) : query.length >= 2 ? (
            <ListItem p={4} color="gray.500" fontSize="sm">
              {t('forms.patient.eventDetails.noTermsFound', 'No medical terms found. You can still use your text.')}
            </ListItem>
          ) : null}
        </List>
      )}
    </Box>
  );
}
