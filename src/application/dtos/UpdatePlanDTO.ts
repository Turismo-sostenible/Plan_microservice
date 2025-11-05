//src\application\dtos\UpdatePlanDTO.ts

//import { ImageFile } from "../ports/ImageStoragePort";

export interface UpdatePlanDTO {
    id: string;
    tenantId: string;
    nombre?: string;
    descripcion?: string;
    precio?: {
        valor: number;
        moneda: "COP" | "USD";
    };
    duracion?: number;
    cupoMaximo?: number;
    fechasDisponibles?: Array<{
        desde: string;
        hasta: string;
    }>;
    //files?: ImageFile[]; por ahora no se requiere
    estado?: "ACTIVO" | "INACTIVO";
}
