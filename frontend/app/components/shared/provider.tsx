import { Toaster } from "sonner"
import { TooltipProvider } from "~/components/ui/tooltip"

export interface ProviderProps {
  children?: React.ReactNode
}

export function Provider({ children }: ProviderProps) {
  return (
    <TooltipProvider>
      {children}
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  )
}
