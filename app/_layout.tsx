import { Stack } from "expo-router";
import { CartProvider } from './Contexts/CartContext';
  export default function layout(){
    return(
      <CartProvider>
        <Stack screenOptions={{headerShown:false}}>
          <Stack.Screen name="(zapatillas)"/>
          <Stack.Screen name="(ropa)"/>
          <Stack.Screen name="(admin)"/>
          <Stack.Screen name="(reloj)"/>
          <Stack.Screen name="(usuario)"/>
          <Stack.Screen name="carrito" />
          <Stack.Screen name="perfil" />
        </Stack> 
      </CartProvider>
    )
  }