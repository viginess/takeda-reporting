import React from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Spinner,
  HStack,
  Text,
} from "@chakra-ui/react";
import { ChevronDown, Globe } from "lucide-react";
import { languages } from "../utils/languages";
import { useLanguageLoader } from "../i18n/loader";
import { useTranslation } from "react-i18next";

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { loadLanguage, isLoading } = useLanguageLoader();

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) || languages[38]; // Default to English if not found

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={isLoading ? <Spinner size="xs" /> : <ChevronDown size={16} />}
        variant="ghost"
        size="sm"
        disabled={isLoading}
      >
        <HStack spacing={2}>
          <Globe size={16} />
          <Text>{currentLanguage.name}</Text>
        </HStack>
      </MenuButton>
      <MenuList maxH="300px" overflowY="auto">
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => loadLanguage(lang.code)}
            fontWeight={i18n.language === lang.code ? "bold" : "normal"}
          >
            {lang.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
