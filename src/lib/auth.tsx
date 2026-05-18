'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAllUsers } from './actions';

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  department: string;
  departmentId: string;
  managerId: string | null;
  designation: string;
}

interface AuthContextType {
  currentUser: ClientUser | null;
  switchUser: (userId: string) => void;
  switchToRole: (role: string) => void;
  availableUsers: ClientUser[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then((dbUsers) => {
      const mapped: ClientUser[] = dbUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as ClientUser['role'],
        department: u.department.name,
        departmentId: u.departmentId,
        managerId: u.managerId,
        designation: u.designation,
      }));
      setUsers(mapped);

      // Check if a role was previously selected
      const selectedRole = typeof window !== 'undefined' 
        ? localStorage.getItem('velora_selected_role') 
        : null;
      
      let defaultUser: ClientUser | undefined;
      if (selectedRole) {
        defaultUser = mapped.find(u => u.role === selectedRole);
      }
      if (!defaultUser) {
        defaultUser = mapped.find(u => u.role === 'employee') || mapped[0];
      }
      
      setCurrentUser(defaultUser);
      setLoading(false);
    });
  }, []);

  const switchUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  }, [users]);

  const switchToRole = useCallback((role: string) => {
    const r = role.toLowerCase();
    localStorage.setItem('velora_selected_role', r);
    const user = users.find(u => u.role === r);
    if (user) setCurrentUser(user);
  }, [users]);

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, switchToRole, availableUsers: users, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
