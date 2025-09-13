"use client"

import { ChakraProvider } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

export function Provider(props: ColorModeProviderProps & { children?: React.ReactNode }) {
  const { children, ...rest } = props
  return (
    <ChakraProvider>
      <ColorModeProvider {...(rest as ColorModeProviderProps)}>
        {children}
      </ColorModeProvider>
    </ChakraProvider>
  )
}
