import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenURL?: string;
  stock: number;
  categoria: string;
  color?: string;
  talla?: string;
  marca?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'cantidad'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; cantidad: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex >= 0) {
        const existingItem = state.items[existingItemIndex];
        if (existingItem.cantidad >= existingItem.stock) {
          Alert.alert('Error', 'No hay suficiente stock disponible');
          return state;
        }

        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          cantidad: existingItem.cantidad + 1
        };

        return {
          ...state,
          items: updatedItems,
          total: state.total + action.payload.precio,
          itemCount: state.itemCount + 1
        };
      } else {
        if (action.payload.stock < 1) {
          Alert.alert('Error', 'Producto sin stock disponible');
          return state;
        }

        const newItem = { ...action.payload, cantidad: 1 };
        return {
          ...state,
          items: [...state.items, newItem],
          total: state.total + action.payload.precio,
          itemCount: state.itemCount + 1
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.id === action.payload);
      if (!itemToRemove) return state;

      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        total: state.total - (itemToRemove.precio * itemToRemove.cantidad),
        itemCount: state.itemCount - itemToRemove.cantidad
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, cantidad } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === id);
      
      if (itemIndex === -1) return state;

      const item = state.items[itemIndex];
      const newQuantity = Math.min(Math.max(1, cantidad), item.stock);

      if (newQuantity !== cantidad) {
        Alert.alert('Error', `No puedes agregar más de ${item.stock} unidades`);
      }

      const updatedItems = [...state.items];
      const quantityDifference = newQuantity - item.cantidad;
      
      updatedItems[itemIndex] = {
        ...item,
        cantidad: newQuantity
      };

      return {
        ...state,
        items: newQuantity <= 0 
          ? updatedItems.filter(item => item.id !== id)
          : updatedItems,
        total: state.total + (quantityDifference * item.precio),
        itemCount: state.itemCount + quantityDifference
      };
    }
    
    case 'CLEAR_CART':
      return initialState;
    
    case 'LOAD_CART':
      return action.payload;
    
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'cantidad'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Cargar carrito al iniciar
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem('@cart');
        if (savedCart) {
          dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
          console.log('Carrito cargado desde AsyncStorage:', JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error al cargar el carrito:', error);
      }
    };
    
    loadCart();
  }, []);

  // Guardar carrito cuando cambie
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('@cart', JSON.stringify(state));
        console.log('Carrito guardado en AsyncStorage:', state);
      } catch (error) {
        console.error('Error al guardar el carrito:', error);
      }
    };
    
    saveCart();
  }, [state]);

  const addItem = (item: Omit<CartItem, 'cantidad'>) => {
    console.log('Agregando item al carrito:', item);
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: item
    });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, cantidad: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, cantidad } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}