"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (data: { email: string; password: string }) => {
    setError("");
    try {
      await login(data.email, data.password);
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return <AuthForm mode="login" onSubmit={handleSubmit} error={error} />;
}
