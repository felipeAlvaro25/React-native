// components/AddToCartButton.tsx
import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styled } from 'styled-components/native';
import { useCart } from '../Contexts/CartContext';

interface AddToCartButtonProps {
  producto: {
    id: string;
    nombre: string;
    precio: number;
    imagenURL?: string;
    stock: number;
    categoria: string;
    color?: string;
    talla?: string;
    marca?: string;
  };
  variant?: 'single' | 'double';
}

export function AddToCartButton({ producto, variant = 'single' }: AddToCartButtonProps) {
  const { addItem, isInCart, getItemQuantity } = useCart();

  const handleAddToCart = () => {
    if (producto.stock <= 0) {
      Alert.alert('Sin stock', 'Este producto no tiene stock disponible');
      return;
    }

    const currentQuantity = getItemQuantity(producto.id);
    if (currentQuantity >= producto.stock) {
      Alert.alert('Stock insuficiente', `Solo hay ${producto.stock} unidades disponibles`);
      return;
    }

    addItem({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagenURL: producto.imagenURL,
      stock: producto.stock,
      categoria: producto.categoria,
      color: producto.color,
      talla: producto.talla,
      marca: producto.marca
    });

    Alert.alert(
      'Agregado al carrito',
      `${producto.nombre} ha sido agregado al carrito`,
      [{ text: 'OK' }]
    );
  };

  if (variant === 'double') {
    return (
      <AddToCartButtonDouble onPress={handleAddToCart}>
        <MaterialIcons name="add-shopping-cart" size={16} color="white" />
      </AddToCartButtonDouble>
    );
  }

  return (
    <AddToCartButtonSingle onPress={handleAddToCart}>
      <AddToCartText>
        {isInCart(producto.id) ? 'Agregar más' : 'Agregar al carrito'}
      </AddToCartText>
    </AddToCartButtonSingle>
  );
}

const AddToCartButtonSingle = styled(TouchableOpacity)`
  background-color: #4CAF50;
  padding: 10px 15px;
  border-radius: 8px;
  flex: 1;
  margin-right: 8px;
  align-items: center;
  justify-content: center;
`;

const AddToCartButtonDouble = styled(TouchableOpacity)`
  background-color: #4CAF50;
  padding: 8px;
  border-radius: 6px;
  flex: 1;
  margin-right: 4px;
  align-items: center;
  justify-content: center;
`;

const AddToCartText = styled(Text)`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;