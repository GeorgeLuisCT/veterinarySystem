import React, { createContext, useContext, useState } from "react";
import { EmployeeSummaryResponse } from "../types/employee-summary-response";
import { PaginatedResponse } from "@/types/paginated-response";

interface EmployeeContextType {
  employees: PaginatedResponse<EmployeeSummaryResponse>;
  setEmployees: React.Dispatch<React.SetStateAction<PaginatedResponse<EmployeeSummaryResponse>>>;
  addEmployee: (employee: EmployeeSummaryResponse) => void;
  removeEmployee: (id: number) => void;
  updateEmployee: (employee: EmployeeSummaryResponse) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (!context) throw new Error("useEmployeeContext debe usarse dentro de EmployeeProvider");
  return context;
};

export const EmployeeProvider = ({ children }: { children: React.ReactNode }) => {
  const [employees, setEmployees] = useState<PaginatedResponse<EmployeeSummaryResponse>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    pageSize: 0,
    currentPage: 0,
  });

  const addEmployee = (employee: EmployeeSummaryResponse) => {
    setEmployees(prev => ({
      ...prev,
      content: [employee, ...prev.content],
    }));
  };

  const removeEmployee = (id: number) => {
    setEmployees(prev => ({
      ...prev,
      content: prev.content.filter(e => e.id !== id),
    }));
  };

  const updateEmployee = (updated: EmployeeSummaryResponse) => {
    setEmployees(prev => ({
      ...prev,
      content: prev.content.map(e => (e.id === updated.id ? updated : e)),
    }));
  };

  return (
    <EmployeeContext.Provider
      value={{ employees, setEmployees, addEmployee, removeEmployee, updateEmployee }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};
