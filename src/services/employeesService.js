import { callApi } from './apiClient.js';

export const listEmployees = () => callApi('listEmployees', {});
export const searchEmployees = (query) => callApi('searchEmployees', { query });
export const createEmployee = (employee) => callApi('createEmployee', { employee });
export const updateEmployee = (employeeId, employee) => callApi('updateEmployee', { employeeId, employee });
export const disableEmployee = (employeeId) => callApi('disableEmployee', { employeeId });
export const deleteEmployee = (employeeId) => callApi('deleteEmployee', { employeeId });
