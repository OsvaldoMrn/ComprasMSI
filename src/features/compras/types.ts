export type CompraMSI = {
  id: number;
  nombreProducto: string;
  montoTotalCentavos: number;
  mesesAPagar: number;
  fechaCompra: string;
  fechaPrimerCargo: string;
  tarjetaId: number | null;
  categoriaId: number | null;
};
