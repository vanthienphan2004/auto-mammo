import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/_auth/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  // const {
  //   emailAddress,
  //   password,
  //   errors,
  //   setEmailAddress,
  //   setPassword,
  //   handleSubmit,
  // } = useSignInForm();

  return <div>Haha</div>;
}
