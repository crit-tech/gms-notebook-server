import {
  createTheme,
  responsiveFontSizes,
  ThemeOptions,
} from "@mui/material/styles";

import "./font.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const lightPalette = {
  mode: "light",
  primary: {
    main: "#ba0404",
  },
  secondary: {
    main: "#04baba",
  },
  neutral: {
    main: "#9b9b9b",
  },
  contrastThreshold: 4.5,
} as ThemeOptions["palette"];

const darkPalette = {
  mode: "dark",
  primary: {
    main: "#ba0404",
  },
  secondary: {
    main: "#04baba",
  },
  neutral: {
    main: "#9b9b9b",
  },
  contrastThreshold: 4.5,
} as ThemeOptions["palette"];

const defaultTheme = createTheme({ palette: lightPalette });

const typography = {
  h1: {
    fontFamily: "a Absolute Empire," + defaultTheme.typography.h1.fontFamily,
  },
};

const breakpoints = {
  values: {
    ...defaultTheme.breakpoints.values,
    sm: 520,
  },
};

const components = {
  MuiCssBaseline: {
    styleOverrides: `
      summary {
        cursor: pointer;
      }
    `,
  },
} as ThemeOptions["components"];

// Create a theme instance.
export const lightTheme = createTheme({
  typography,
  breakpoints,
  palette: lightPalette,
  components,
});

export const lightResponsiveFontsTheme = responsiveFontSizes(lightTheme);

export const darkTheme = createTheme({
  typography,
  breakpoints,
  palette: darkPalette,
  components: {
    ...components,
    MuiLink: {
      defaultProps: {
        color: "primary.light",
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: "primary",
        enableColorOnDark: true,
      },
    },
  },
});

export const darkResponsiveFontsTheme = responsiveFontSizes(darkTheme);
