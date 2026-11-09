"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/app/context/AuthContext";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (data: {
    name?: string;
    email: string;
    password: string;
  }) => {
    setError("");
    try {
      await register(data.name || "", data.email, data.password);
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return <AuthForm mode="register" onSubmit={handleSubmit} error={error} />;
}
