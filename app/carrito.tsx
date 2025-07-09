import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const CartScreen = () => {
  // Estado para los productos en el carrito
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Zapatillas Deportivas',
      price: 89.99,
      quantity: 1,
      image: 'https://via.placeholder.com/150',
    },
    {
      id: '2',
      name: 'Camiseta Premium',
      price: 29.99,
      quantity: 2,
      image: 'https://via.placeholder.com/150',
    },
    {
      id: '3',
      name: 'Reloj Inteligente',
      price: 199.99,
      quantity: 1,
      image: 'https://via.placeholder.com/150',
    },
  ]);

  // Calcular el total
  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ).toFixed(2);
  };

  // Aumentar cantidad
  const increaseQuantity = (id) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Disminuir cantidad
  const decreaseQuantity = (id) => {
    setCartItems(cartItems.map(item =>
      item.id === id && item.quantity > 1 
        ? { ...item, quantity: item.quantity - 1 } 
        : item
    ));
  };

  // Eliminar producto
  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Renderizar cada item del carrito
  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={() => decreaseQuantity(item.id)}
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            onPress={() => increaseQuantity(item.id)}
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        onPress={() => removeItem(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash" size={24} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tu Carrito</Text>
        <Text style={styles.itemCount}>{cartItems.length} items</Text>
      </View>
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={100} color="#ccc" />
          <Text style={styles.emptyText}>Tu carrito está vacío</Text>
          <Text style={styles.emptySubText}>Agrega algunos productos</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total:</Text>
              <Text style={styles.totalPrice}>${getTotalPrice()}</Text>
            </View>
            
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutText}>Proceder al Pago</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  listContent: {
    paddingBottom: 100,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e86de',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2e86de',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  checkoutButton: {
    backgroundColor: '#2e86de',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
  },
});

export default CartScreen;