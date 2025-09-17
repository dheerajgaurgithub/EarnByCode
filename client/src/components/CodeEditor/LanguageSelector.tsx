import { Box, Text } from "@chakra-ui/react";
import { LANGUAGE_VERSIONS } from "./constants";
const languages = Object.entries(LANGUAGE_VERSIONS);

// Define props interface
interface LanguageSelectorProps {
  language: string;
  onSelect: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, onSelect }) => {
  return (
    <Box ml={2} mb={4}>
      <Text mb={2} fontSize="lg">
        Language:
      </Text>
      <select
        value={language}
        onChange={(e) => onSelect(e.target.value)}
        style={{ maxWidth: 220, backgroundColor: '#110c1b', color: '#e2e8f0', padding: '6px 8px', borderRadius: 6, border: '1px solid #334155' }}
      >
        {languages.map(([lang, version]) => (
          <option key={lang} value={lang}>
            {lang} ({version})
          </option>
        ))}
      </select>
    </Box>
  );
};

export default LanguageSelector;
  