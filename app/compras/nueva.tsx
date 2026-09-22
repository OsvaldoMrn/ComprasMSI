import { router } from 'expo-router';
import { View } from 'react-native';
import { CompraForm } from '../../src/components/compras/CompraForm';
import { useComprasMSI } from '../../src/features/compras/hooks';

export default function NuevaCompraScreen() {
  return (
    <View style={{ flex: 1 }}>
      <NewPurchaseForm />
    </View>
  );
}

function NewPurchaseForm() {
  const { add } = useComprasMSI();
  return <CompraForm submitLabel="Guardar compra" onSubmit={async (value) => { await add(value); router.replace('/compras'); }} />;
}
