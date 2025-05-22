import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      primary: '#2B6CB0', // Medical blue
      secondary: '#48BB78', // Healing green
      accent: '#F6AD55', // Warm orange
      danger: '#E53E3E', // Alert red
      light: '#EBF8FF', // Light blue
      dark: '#2D3748', // Dark gray
    },
  },
  fonts: {
    heading: '"Poppins", sans-serif',
    body: '"Inter", sans-serif',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.primary',
          color: 'white',
          _hover: {
            bg: 'blue.600',
          },
        },
        outline: {
          borderColor: 'brand.primary',
          color: 'brand.primary',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'lg',
        },
      },
    },
  },
});

export default theme; 