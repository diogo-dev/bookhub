"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { API_ENDPOINTS } from "../api/endpoints";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, cpf: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const isAuthenticated = !!user;
    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        fetchUserData(token);
    }, []);

    async function fetchUserData(token: string) {
        try {
            setLoading(true);
            const res = await fetch(API_ENDPOINTS.profile, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Token inválido");

            const data = await res.json();
            setUser(data);
        } catch (err) {
            localStorage.removeItem("token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const res = await fetch(API_ENDPOINTS.auth.login, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            throw new Error("Credenciais inválidas");
        }

        const data = await res.json();
        const token = data.token;

        localStorage.setItem("token", token);

        await fetchUserData(token);
    }

    function logout() {
        localStorage.removeItem("token");
        setUser(null);
        // mudar para a página principal
        router.push('/')
    }

    async function register(name: string, email: string, cpf: string, password: string) {
        const res = await fetch(API_ENDPOINTS.auth.register, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, cpf, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Erro ao fazer registro");
        }

        const data = await res.json();
        const token = data.token;

        localStorage.setItem("token", token);

        await fetchUserData(token);
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, register }}>
        {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  return useContext(AuthContext);
}
