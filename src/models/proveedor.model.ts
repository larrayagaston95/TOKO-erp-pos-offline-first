export interface Proveedor {
  id: string;
  empresa_id: number | string;
  razon_social: string;
  cuit: string;
  telefono?: string;
  viajante_contacto?: string;
}
