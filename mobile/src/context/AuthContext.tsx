import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import * as Storage from "@/lib/storage";
import { loginCustomer, loginStaff, signupCustomer } from "@/api/auth";
import { fetchMe } from "@/api/me";
import { Customer, StaffUser } from "@/api/types";

const TOKEN_KEY = "loco_chicken_auth_token";

type CustomerSession = { role: "CUSTOMER"; token: string; customer: Customer };
type StaffSession = { role: "STAFF"; token: string; staff: StaffUser & { locationName: string } };
export type Session = CustomerSession | StaffSession;

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signup: (params: { name: string; email: string; password: string }) => Promise<void>;
  loginAsCustomer: (params: { email: string; password: string }) => Promise<void>;
  loginAsStaff: (params: { staffUserId: string; pin: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function sessionFromToken(token: string): Promise<Session> {
  const me = await fetchMe(token);
  if (me.role === "CUSTOMER") {
    return { role: "CUSTOMER", token, customer: me.customer };
  }
  return {
    role: "STAFF",
    token,
    staff: {
      id: me.staff.id,
      name: me.staff.name,
      points: me.staff.points,
      locationId: me.staff.location.id,
      locationName: me.staff.location.name,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await Storage.getItem(TOKEN_KEY);
        if (token) {
          const restored = await sessionFromToken(token);
          setSession(restored);
        }
      } catch {
        await Storage.deleteItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const applyToken = useCallback(async (token: string) => {
    await Storage.setItem(TOKEN_KEY, token);
    const next = await sessionFromToken(token);
    setSession(next);
  }, []);

  const signup = useCallback(
    async (params: { name: string; email: string; password: string }) => {
      const { token } = await signupCustomer(params);
      await applyToken(token);
    },
    [applyToken]
  );

  const loginAsCustomer = useCallback(
    async (params: { email: string; password: string }) => {
      const { token } = await loginCustomer(params);
      await applyToken(token);
    },
    [applyToken]
  );

  const loginAsStaff = useCallback(
    async (params: { staffUserId: string; pin: string }) => {
      const { token } = await loginStaff(params);
      await applyToken(token);
    },
    [applyToken]
  );

  const logout = useCallback(async () => {
    await Storage.deleteItem(TOKEN_KEY);
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session) return;
    const next = await sessionFromToken(session.token);
    setSession(next);
  }, [session]);

  const value = useMemo(
    () => ({ session, isLoading, signup, loginAsCustomer, loginAsStaff, logout, refreshSession }),
    [session, isLoading, signup, loginAsCustomer, loginAsStaff, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
