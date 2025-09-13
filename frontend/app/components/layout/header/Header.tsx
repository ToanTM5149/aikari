import { Button, Stack, Text, Box, Flex} from "@chakra-ui/react";
import LogoWithText  from "../../atoms/LogoWithText";


export default function Header() {
  return (
    <>
      <Box>
        <Flex>
          <Stack direction="row" gap={4} align="center">
            <LogoWithText />
            <Text fontSize="xl" fontWeight="bold" color="blue.600">
              Aikari
            </Text>
            <Button colorScheme="blue" variant="outline" size="sm">
              Sign In
            </Button>
          </Stack>
        </Flex>
      </Box>
    </>
  )

}