// components/CartBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'styled-components/native';
import { useCart } from '../Contexts/CartContext';

export function CartBadge() {
  const { state } = useCart();

  if (state.itemCount === 0) return null;

  return (
    <Badge>
      <BadgeText>{state.itemCount}</BadgeText>
    </Badge>
  );
}

const Badge = styled(View)`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #E24329;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  padding: 0 4px;
`;

const BadgeText = styled(Text)`
  color: white;
  font-size: 12px;
  font-weight: bold;
`;