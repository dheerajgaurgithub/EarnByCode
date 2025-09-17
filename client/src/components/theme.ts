// Minimal theme to avoid @chakra-ui/react extendTheme ESM export issues
// You can enhance this later by importing extendTheme when available
// and merging this config into Chakra's default theme.
const theme: any = {
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
};

export default theme;
