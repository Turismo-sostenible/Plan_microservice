// src\application\dtos\ListPlansDTO.ts
export interface ListPlansDTO {
  tenantId: string;
  page: number;
  limit: number;
  estado?: "ACTIVO" | "INACTIVO";
}
