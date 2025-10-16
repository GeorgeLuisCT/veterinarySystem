"use client";

import { UserInfo } from "@/app/dashboard/security/users/types/user-info";
import { createContext, useContext, useState, ReactNode } from "react";

interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: (user: UserInfo | null) => void;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
  initialUser: UserInfo | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(initialUser);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
