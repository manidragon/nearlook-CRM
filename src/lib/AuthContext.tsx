'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffMember, StaffRole } from './types';
import { DEMO_PROFILES, RBAC } from './auth';

interface AuthContextType {
  currentStaff: StaffMember;
  currentUser: StaffMember;
  setCurrentStaff: (staff: StaffMember) => void;
  updateCurrentUser: (updated: Partial<StaffMember>) => void;
  allProfiles: StaffMember[];
  canViewFinancials: boolean;
  canManageAccounts: boolean;
  canManageStaff: boolean;
  canManageUsers: boolean;
  isOwnerOrAdmin: boolean;
  isAccountManager: boolean;
  isFieldStaff: boolean;
  hasModuleAccess: (moduleKey: string) => boolean;
  canAccessConsultationNotes: (assignedStaffId?: string) => boolean;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaffState] = useState<StaffMember>(DEMO_PROFILES[0]);
  const [allProfiles, setAllProfiles] = useState<StaffMember[]>(DEMO_PROFILES);

  const refreshProfiles = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAllProfiles(data.data);
        const currentSavedId = localStorage.getItem('nearlook_active_staff_id') || currentStaff.id;
        const matched = data.data.find((p: StaffMember) => p.id === currentSavedId);
        if (matched) {
          setCurrentStaffState(matched);
        }
      }
    } catch (e) {
      // Keep demo profiles
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  // Load from localStorage if present
  useEffect(() => {
    const savedId = localStorage.getItem('nearlook_active_staff_id');
    if (savedId) {
      const found = allProfiles.find(p => p.id === savedId);
      if (found) setCurrentStaffState(found);
    }
  }, [allProfiles]);

  const setCurrentStaff = (staff: StaffMember) => {
    setCurrentStaffState(staff);
    localStorage.setItem('nearlook_active_staff_id', staff.id);
  };

  const updateCurrentUser = (updated: Partial<StaffMember>) => {
    setCurrentStaffState(prev => {
      const merged = { ...prev, ...updated };
      setAllProfiles(all => all.map(p => p.id === merged.id ? merged : p));
      return merged;
    });
  };

  const role = currentStaff.role;
  const isOwnerOrAdmin = RBAC.isOwnerOrAdmin(role);
  const isAccountManager = role === 'ACCOUNT_MANAGER';
  const canManageUsers = isOwnerOrAdmin || Boolean(currentStaff.canManageUsers);
  const canViewFinancials = RBAC.canViewFinancials(role);
  const canManageAccounts = RBAC.canManageAccounts(role);
  const canManageStaff = RBAC.canManageStaff(role, currentStaff.canManageUsers);
  const isFieldStaff = RBAC.isRestrictedFieldStaff(role);

  const hasModuleAccess = (moduleKey: string) => {
    return RBAC.hasModulePermission(currentStaff, moduleKey);
  };

  const canAccessConsultationNotes = (assignedStaffId?: string) => {
    return RBAC.canViewConsultationNotes(role, assignedStaffId, currentStaff.id);
  };

  return (
    <AuthContext.Provider
      value={{
        currentStaff,
        currentUser: currentStaff,
        setCurrentStaff,
        updateCurrentUser,
        allProfiles,
        canViewFinancials,
        canManageAccounts,
        canManageStaff,
        canManageUsers,
        isOwnerOrAdmin,
        isAccountManager,
        isFieldStaff,
        hasModuleAccess,
        canAccessConsultationNotes,
        refreshProfiles
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
