export type CompraMSI = {
  id: number;
  nombreProducto: string;
  montoTotalCentavos: number;
  mesesAPagar: number;
  fechaCompra: string;
  fechaPrimerCargo: string;
  tarjetaId: number | null;
  categoriaId: number | null;
  tarjetaNombre: string | null;
  comercioNombre: string | null;
  categoriaNombre: string | null;
  estado: 'active' | 'archived';
};

export type NuevaCompraMSI = Omit<
  CompraMSI,
  'id' | 'tarjetaId' | 'categoriaId' | 'tarjetaNombre' | 'comercioNombre' | 'categoriaNombre' | 'estado'
> & {
  tarjetaNombre?: string;
  comercioNombre?: string;
  categoriaNombre?: string;
};
