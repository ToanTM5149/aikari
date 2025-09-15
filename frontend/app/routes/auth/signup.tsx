import { SignupCarousel } from "~/components/common/signup/SignupCarousel";
import { SignupForm } from "~/components/common/signup/SignupForm";
import { Flex } from "@chakra-ui/react";

export function loader() {
  return null;
}

export default function Signup() {
  return (
    <>
    <Flex justifyContent="center" alignItems="center" h="screen">
      <SignupCarousel />
      <SignupForm />
    </Flex>
    </>
  );
}
