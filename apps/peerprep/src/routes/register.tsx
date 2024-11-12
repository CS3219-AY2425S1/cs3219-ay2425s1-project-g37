import { Button } from "@peerprep/ui/button";
import { Link } from "@peerprep/ui/link";
import { Input } from "@peerprep/ui/text-input";
import { useRegister } from "@peerprep/utils/client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { trigger, isMutating } = useRegister();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <form
      className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-12"
      onSubmit={async e => {
        e.preventDefault();
        await trigger({ username, email, password });
        toast.success("Account created successfully. Welcome to PeerPrep!");
      }}
    >
      <h1 className="text-main-50 text-2xl">Register</h1>
      <Input
        label="Username"
        type="text"
        name="username"
        required
        pattern="^[a-zA-Z0-9_]{4,32}$"
        value={username}
        onValueChange={setUsername}
        helpText="Only letters, numbers, and underscores are allowed. Must be between 4 and 32 characters."
      />
      <Input
        label="Email"
        type="email"
        name="email"
        required
        value={email}
        onValueChange={setEmail}
      />
      <div className="grid grid-cols-2 gap-6">
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
        <Input
          label="Confirm Password"
          type="password"
          name="confirm-password"
          required
          pattern={password}
          value={confirmPassword}
          onValueChange={setConfirmPassword}
        />
      </div>
      <Button variants={{ variant: "primary" }} type="submit" disabled={isMutating}>
        Sign up
      </Button>
      <p>
        Or{" "}
        <Link href="/login" className="text-main-50 font-bold underline-offset-4 hover:underline">
          log in
        </Link>{" "}
        if you already have an account.
      </p>
    </form>
  );
}
