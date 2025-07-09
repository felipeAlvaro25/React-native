// hooks/useCheckout.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '../../Firebase/firebaseconfig';
import { CartItem } from '../Contexts/CartContext';

const API_URL = 'https://felipe25.alwaysdata.net/api/';

export interface CheckoutData {
  direccion: string;
  telefono: string;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  notas?: string;
}

export function useCheckout() {
  const [loading, setLoading] = useState(false);

  const processCheckout = async (
    items: CartItem[],
    total: number,
    checkoutData: CheckoutData
  ) => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes estar logueado para realizar una compra');
      return false;
    }

    setLoading(true);

    try {
      // Datos para el carrito
      const carritoData = {
        uid: auth.currentUser.uid,
        total: total,
        direccion: checkoutData.direccion,
        telefono: checkoutData.telefono,
        metodo_pago: checkoutData.metodoPago,
        notas: checkoutData.notas || '',
        items: items.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          subtotal: item.precio * item.cantidad
        }))
      };

      // Enviar al servidor
      const response = await fetch(`${API_URL}checkout.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carritoData)
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Compra realizada',
          `Tu pedido #${result.pedido_id} ha sido procesado exitosamente`,
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert('Error', result.message || 'Error al procesar la compra');
        return false;
      }
    } catch (error) {
      console.error('Error en checkout:', error);
      Alert.alert('Error', 'Error de conexión al procesar la compra');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { processCheckout, loading };
}
