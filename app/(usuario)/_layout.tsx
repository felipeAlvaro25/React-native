// app/_layout.tsx
import { CartProvider } from '../Contexts/CartContext';
import { Stack } from 'expo-router';
export default function RootLayout() {
  return (
    <CartProvider>
      <Stack>
        <Stack.Screen name="carrito" />
        <Stack.Screen name="(usuario)" />
        {/* otras pantallas */}
      </Stack>
    </CartProvider>
  );
}