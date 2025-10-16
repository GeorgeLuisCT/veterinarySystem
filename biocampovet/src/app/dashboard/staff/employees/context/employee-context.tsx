import React, { createContext, useContext, useState } from "react";
import { EmployeeSummaryResponse } from "../types/employee-summary-response";

interface EmployeeContextType {
  employees: EmployeeSummaryResponse[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeeSummaryResponse[]>>;
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
  const [employees, setEmployees] = useState<EmployeeSummaryResponse[]>([]);

  const addEmployee = (employee: EmployeeSummaryResponse) => {
    setEmployees(prev => [employee, ...prev]);
  };

  const removeEmployee = (id: number) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const updateEmployee = (updated: EmployeeSummaryResponse) => {
    setEmployees(prev =>
      prev.map(e => (e.id === updated.id ? updated : e))
    );
  };

  return (
    <EmployeeContext.Provider
      value={{ employees, setEmployees, addEmployee, removeEmployee, updateEmployee }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};
