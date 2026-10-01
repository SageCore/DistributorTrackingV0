import { apiClient } from './client';
import { Employee, ShiftReport } from '../types';

export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get<Employee[]>('/v2/employees');
  return response.data;
};

export const fetchEmployeeById = async (employeeId: string): Promise<Employee> => {
  const response = await apiClient.get<Employee>(`/v2/employees/${employeeId}`);
  return response.data;
};

export const fetchEmployeeDetail = fetchEmployeeById;

export const createEmployee = async (data: any): Promise<Employee> => {
  const payload = {
    name: data.name,
    employee_code: data.employeeCode || data.employee_code,
    phone: data.phone,
    login_identifier: data.loginIdentifier || data.login_identifier,
    password: data.password,
    active: data.active ?? true,
  };
  const response = await apiClient.post<Employee>('/v2/employees', payload);
  return response.data;
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee> => {
  const response = await apiClient.patch<Employee>(`/v2/employees/${id}`, data);
  return response.data;
};

export const toggleEmployeeActive = async (
  params: { employeeId: string; active: boolean } | string,
  activeArg?: boolean
): Promise<Employee> => {
  if (typeof params === 'object') {
    return updateEmployee(params.employeeId, { active: params.active });
  }
  return updateEmployee(params, { active: activeArg ?? true });
};

export const fetchEmployeeShifts = async (employeeId: string): Promise<ShiftReport[]> => {
  const response = await apiClient.get<ShiftReport[]>(`/v2/employees/${employeeId}/shifts`);
  return response.data;
};

export const fetchEmployeeShiftsHistory = fetchEmployeeShifts;
