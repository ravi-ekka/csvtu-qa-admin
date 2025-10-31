// app/Protected.tsx
"use client";
import { useAuth } from "./AuthContext";
import Loading from "./components/loading";
import LoginPage from "./login/page";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <LoginPage />;

  return (
    <div className="flex-1 justify-center items-center w-full">
      {children}
    </div>);
}