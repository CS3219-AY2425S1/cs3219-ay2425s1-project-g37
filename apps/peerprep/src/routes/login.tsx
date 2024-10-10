import { Button } from "@peerprep/ui/button";
import { Link } from "@peerprep/ui/link";
import { Input } from "@peerprep/ui/text-input";
import { useState } from "react";
import toast from "react-hot-toast";

import { useLogin } from "~/lib/auth";

export default function LoginPage() {
  const { trigger, isMutating } = useLogin();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-12"
      onSubmit={async e => {
        e.preventDefault();
        if (isMutating) return;
        await trigger({ emailOrUsername, password });
        toast.success("Welcome back!");
      }}
    >
      <h1 className="text-main-50 text-2xl">Login</h1>
      <Input
        label="Email or username"
        type="text"
        name="email-or-username"
        required
        value={emailOrUsername}
        onValueChange={setEmailOrUsername}
      />
      <Input
        label="Password"
        type="password"
        name="password"
        required
        minLength={8}
        maxLength={128}
        value={password}
        onValueChange={setPassword}
      />
      <Button variants={{ variant: "primary" }} disabled={isMutating} type="submit">
        Log in
      </Button>
      <p>
        Or{" "}
        <Link
          href="/register"
          className="text-main-50 font-bold underline-offset-4 hover:underline"
        >
          sign up
        </Link>{" "}
        if you don't have an account yet.
      </p>
    </form>
  );
}
