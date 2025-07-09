import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, TextInput, ScrollView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styled } from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useCart, CartItem } from '../Contexts/CartContext';
import { router } from 'expo-router';
import { auth } from '../../Firebase/firebaseconfig';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function CarritoScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    direccion: '',
    metodoPago: 'efectivo'
  });

  // Constantes para cálculos
  const ITBMS_RATE = 0.07; // 7% de ITBMS

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  // Debug: Mostrar contenido del carrito
  useEffect(() => {
    console.log("Productos en carrito:", state.items);
  }, [state.items]);

  // Calcular totales
  const subtotal = state.total;
  const itbms = subtotal * ITBMS_RATE;
  const total = subtotal + itbms;

  const ProductImage = ({ uri, style }: { uri?: string | null, style?: any }) => {
    const [imgError, setImgError] = useState(false);
    
    if (imgError || !uri) {
      return (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          <MaterialIcons name="image" size={style?.width ? style.width/3 : 40} color="#ccc" />
        </View>
      );
    }

    return (
      <Image
        source={{ uri }}
        style={style}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <CartItemContainer>
      <ItemImageContainer>
        <ProductImage 
          uri={item.imagenURL}
          style={{ width: '100%', height: '100%' }}
        />
      </ItemImageContainer>
      
      <ItemInfo>
        <ItemName>{item.nombre}</ItemName>
        {item.categoria && <ItemCategory>{item.categoria}</ItemCategory>}
        {item.color && <ItemAttribute>Color: {item.color}</ItemAttribute>}
        {item.talla && <ItemAttribute>Talla: {item.talla}</ItemAttribute>}
        {item.marca && <ItemAttribute>Marca: {item.marca}</ItemAttribute>}
        
        <ItemPrice>${item.precio.toFixed(2)}</ItemPrice>
        <ItemSubtotal>Subtotal: ${(item.precio * item.cantidad).toFixed(2)}</ItemSubtotal>
      </ItemInfo>
      
      <ItemControls>
        <RemoveButton onPress={() => removeItem(item.id)}>
          <MaterialIcons name="delete" size={20} color="#E24329" />
        </RemoveButton>
        
        <QuantityContainer>
          <QuantityButton 
            onPress={() => updateQuantity(item.id, item.cantidad - 1)}
            disabled={item.cantidad <= 1}
          >
            <MaterialIcons name="remove" size={20} color="#666" />
          </QuantityButton>
          
          <QuantityText>{item.cantidad}</QuantityText>
          
          <QuantityButton 
            onPress={() => updateQuantity(item.id, item.cantidad + 1)}
            disabled={item.cantidad >= item.stock}
          >
            <MaterialIcons name="add" size={20} color="#666" />
          </QuantityButton>
        </QuantityContainer>
        
        <StockText>Stock: {item.stock}</StockText>
      </ItemControls>
    </CartItemContainer>
  );

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    try {
      const orderData = {
        firebase_uid: currentUser?.uid,
        items: state.items,
        direccion: checkoutData.direccion,
        metodoPago: checkoutData.metodoPago,
        subtotal: subtotal,
        itbms: itbms,
        total: total
      };

      const response = await fetch('https://felipe25.alwaysdata.net/api/carrito.php', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      // Éxito - limpiar carrito y mostrar confirmación
      clearCart();
      Alert.alert('Éxito', 'Pedido procesado correctamente');
      
    } catch (error) {
      console.error('Error en checkout:', error);
      Alert.alert('Error', error.message || 'Error al procesar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const CheckoutModal = () => (
    <Modal
      visible={showCheckout}
      animationType="slide"
      onRequestClose={() => setShowCheckout(false)}
    >
      <CheckoutContainer>
        <CheckoutHeader>
          <CheckoutTitle>Finalizar Compra</CheckoutTitle>
          <CloseButton onPress={() => setShowCheckout(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </CloseButton>
        </CheckoutHeader>

        <ScrollView showsVerticalScrollIndicator={false}>
          <CheckoutContent>
            <FormSection>
              <FormLabel>Dirección de entrega *</FormLabel>
              <FormInput
                value={checkoutData.direccion}
                onChangeText={(text) => setCheckoutData(prev => ({ ...prev, direccion: text }))}
                placeholder="Ingresa tu dirección completa"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </FormSection>

            <FormSection>
              <FormLabel>Método de pago</FormLabel>
              <PaymentMethodsContainer>
                {[
                  { key: 'efectivo', label: 'Efectivo' },
                  { key: 'tarjeta', label: 'Tarjeta' },
                  { key: 'transferencia', label: 'Transferencia' }
                ].map((method) => (
                  <PaymentMethodButton
                    key={method.key}
                    selected={checkoutData.metodoPago === method.key}
                    onPress={() => setCheckoutData(prev => ({ ...prev, metodoPago: method.key }))}
                  >
                    <PaymentMethodText selected={checkoutData.metodoPago === method.key}>
                      {method.label}
                    </PaymentMethodText>
                  </PaymentMethodButton>
                ))}
              </PaymentMethodsContainer>
            </FormSection>

            <OrderSummary>
              <SummaryTitle>Resumen del pedido</SummaryTitle>
              <SummaryRow>
                <SummaryLabel>Subtotal ({state.itemCount} productos)</SummaryLabel>
                <SummaryValue>${subtotal.toFixed(2)}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>ITBMS (7%)</SummaryLabel>
                <SummaryValue>${itbms.toFixed(2)}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>Envío</SummaryLabel>
                <SummaryValue>Gratis</SummaryValue>
              </SummaryRow>
              <SummaryDivider />
              <SummaryRow>
                <SummaryLabelTotal>Total</SummaryLabelTotal>
                <SummaryValueTotal>${total.toFixed(2)}</SummaryValueTotal>
              </SummaryRow>
            </OrderSummary>

            <CheckoutButton 
              onPress={handleCheckout}
              disabled={isProcessing}
              style={{ opacity: isProcessing ? 0.6 : 1 }}
            >
              <CheckoutButtonText>
                {isProcessing ? 'Procesando...' : 'Confirmar pedido'}
              </CheckoutButtonText>
            </CheckoutButton>
          </CheckoutContent>
        </ScrollView>
      </CheckoutContainer>
    </Modal>
  );

  if (state.items.length === 0) {
    return (
      <>
        <GradientBackground />
        <BlurredOverlay />
        <Container>
          <Header>
            <BackButton onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </BackButton>
            <HeaderTitle>Carrito</HeaderTitle>
          </Header>
          
          <EmptyCartContainer>
            <MaterialIcons name="shopping-cart" size={80} color="rgba(255,255,255,0.5)" />
            <EmptyCartText>Tu carrito está vacío</EmptyCartText>
            <EmptyCartSubtext>Agrega productos para comenzar tu compra</EmptyCartSubtext>
            <ContinueShoppingButton onPress={() => router.back()}>
              <ContinueShoppingText>Continuar comprando</ContinueShoppingText>
            </ContinueShoppingButton>
          </EmptyCartContainer>
        </Container>
      </>
    );
  }

  return (
    <>
      <GradientBackground />
      <BlurredOverlay />
      <Container>
        <Header>
          <BackButton onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </BackButton>
          <HeaderTitle>Carrito ({state.itemCount})</HeaderTitle>
          <ClearCartButton onPress={() => {
            Alert.alert(
              'Vaciar carrito',
              '¿Estás seguro de que quieres vaciar el carrito?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vaciar', onPress: clearCart, style: 'destructive' }
              ]
            );
          }}>
            <MaterialIcons name="delete-sweep" size={24} color="#E24329" />
          </ClearCartButton>
        </Header>

        <CartList
          data={state.items}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text>No hay productos en el carrito</Text>
            </View>
          }
          contentContainerStyle={{
            paddingBottom: 20,
            flexGrow: 1
          }}
        />

        <BottomSection>
          <TotalContainer>
            <TotalRow>
              <TotalLabel>Subtotal: </TotalLabel>
              <TotalValue>${subtotal.toFixed(2)}</TotalValue>
            </TotalRow>
            <TotalRow>
              <TotalLabel>ITBMS: </TotalLabel>
              <TotalValue>${itbms.toFixed(2)}</TotalValue>
            </TotalRow>
            <TotalDivider />
            <TotalRow>
              <TotalLabelFinal>Total: </TotalLabelFinal>
              <TotalValueFinal>${total.toFixed(2)}</TotalValueFinal>
            </TotalRow>
          </TotalContainer>
          
          <CheckoutMainButton onPress={() => setShowCheckout(true)}>
            <CheckoutMainButtonText>Proceder al pago</CheckoutMainButtonText>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </CheckoutMainButton>
        </BottomSection>

        <CheckoutModal />
      </Container>
    </>
  );
}

// Estilos mantenidos iguales
const GradientBackground = styled(LinearGradient).attrs({
  colors: ['rgba(80, 20, 20, 0.8)', 'rgba(0, 0, 0, 0.85)', 'rgba(67, 29, 29, 0.9)', 'rgba(67, 55, 29, 0.9)'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

const BlurredOverlay = styled(BlurView).attrs({
  intensity: 40,
  tint: 'default',
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

const Container = styled(View)`
  flex: 1;
  z-index: 1;
`;

const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  padding-top: 50px;
  background-color: rgba(26, 3, 51, 0.57);
`;

const BackButton = styled(TouchableOpacity)`
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
`;

const HeaderTitle = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: white;
  flex: 1;
  text-align: center;
  margin: 0 20px;
`;

const ClearCartButton = styled(TouchableOpacity)`
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
`;

const CartList = styled(FlatList)`
  flex: 1;
  padding: 20px;
`;

const CartItemContainer = styled(View)`
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  flex-direction: row;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const ItemImageContainer = styled(View)`
  width: 80px;
  height: 80px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
`;

const ItemInfo = styled(View)`
  flex: 1;
  justify-content: space-between;
`;

const ItemName = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`;

const ItemCategory = styled(Text)`
  font-size: 12px;
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 8px;
  align-self: flex-start;
  margin-bottom: 4px;
`;

const ItemAttribute = styled(Text)`
  font-size: 11px;
  color: #777;
  margin-bottom: 2px;
`;

const ItemPrice = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: #E24329;
  margin-top: 4px;
`;

const ItemSubtotal = styled(Text)`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const ItemControls = styled(View)`
  align-items: center;
  justify-content: space-between;
  margin-left: 12px;
`;

const RemoveButton = styled(TouchableOpacity)`
  padding: 8px;
  border-radius: 6px;
  background-color: #f5f5f5;
`;

const QuantityContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  margin: 8px 0;
`;

const QuantityButton = styled(TouchableOpacity)`
  padding: 8px;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const QuantityText = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 12px;
  min-width: 30px;
  text-align: center;
`;

const StockText = styled(Text)`
  font-size: 10px;
  color: #4CAF50;
  text-align: center;
`;

const BottomSection = styled(View)`
  padding: 16px 20px;
  background-color: rgba(255, 255, 255, 0.95);
  border-top-width: 1px;
  border-top-color: #ddd;
`;

const TotalContainer = styled(View)`
  margin-bottom: 16px;
`;

const TotalRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const TotalLabel = styled(Text)`
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

const TotalValue = styled(Text)`
  font-size: 14px;
  color: #666;
`;

const TotalDivider = styled(View)`
  height: 1px;
  background-color: #ddd;
  margin: 8px 0;
`;

const TotalLabelFinal = styled(Text)`
  font-size: 16px;
  color: #333;
  font-weight: bold;
`;

const TotalValueFinal = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: #E24329;
`;

const CheckoutMainButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #E24329;
  padding: 12px 16px;
  border-radius: 8px;
`;

const CheckoutMainButtonText = styled(Text)`
  color: white;
  font-weight: bold;
  font-size: 16px;
  margin-right: 6px;
`;

/* Modal de Checkout */

const CheckoutContainer = styled(View)`
  flex: 1;
  background-color: white;
  padding-top: 50px;
`;

const CheckoutHeader = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

const CheckoutTitle = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: #333;
`;

const CloseButton = styled(TouchableOpacity)`
  padding: 6px;
`;

const CheckoutContent = styled(View)`
  padding: 20px;
`;

const FormSection = styled(View)`
  margin-bottom: 20px;
`;

const FormLabel = styled(Text)`
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 500;
`;

const FormInput = styled(TextInput)`
  border-width: 1px;
  border-color: #ccc;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #333;
  background-color: #fafafa;
  min-height: 60px;
`;

const PaymentMethodsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
`;

const PaymentMethodButton = styled(TouchableOpacity)<{ selected?: boolean }>`
  flex: 1;
  padding: 10px;
  margin-right: 8px;
  border-width: 1px;
  border-color: ${props => (props.selected ? '#E24329' : '#ccc')};
  background-color: ${props => (props.selected ? '#FDECEA' : '#fff')};
  border-radius: 8px;
`;

const PaymentMethodText = styled(Text)<{ selected?: boolean }>`
  text-align: center;
  font-weight: ${props => (props.selected ? 'bold' : 'normal')};
  color: ${props => (props.selected ? '#E24329' : '#333')};
`;

const OrderSummary = styled(View)`
  margin-top: 30px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 12px;
`;

const SummaryTitle = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const SummaryRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const SummaryLabel = styled(Text)`
  font-size: 14px;
  color: #555;
`;

const SummaryValue = styled(Text)`
  font-size: 14px;
  color: #555;
`;

const SummaryDivider = styled(View)`
  height: 1px;
  background-color: #ddd;
  margin: 10px 0;
`;

const SummaryLabelTotal = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const SummaryValueTotal = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #E24329;
`;

const CheckoutButton = styled(TouchableOpacity)`
  margin-top: 20px;
  background-color: #E24329;
  padding: 14px;
  border-radius: 10px;
  align-items: center;
`;

const CheckoutButtonText = styled(Text)`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

/* Carrito vacío */

const EmptyCartContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
`;

const EmptyCartText = styled(Text)`
  font-size: 20px;
  color: white;
  font-weight: bold;
  margin-top: 20px;
`;

const EmptyCartSubtext = styled(Text)`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
  text-align: center;
`;

const ContinueShoppingButton = styled(TouchableOpacity)`
  background-color: #E24329;
  padding: 12px 20px;
  border-radius: 8px;
`;

const ContinueShoppingText = styled(Text)`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

