import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styled } from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { auth } from '../../Firebase/firebaseconfig';
import { onAuthStateChanged, User } from 'firebase/auth';

interface CompraItem {
  id: number;
  id_producto: number;
  canti_productos: number;
  subtotal: number;
  itbms: number;
  total: number;
  direccion: string;
  metodo_pago: string;
  status: string;
  fecha_compra: string;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    imagenURL: string;
    categoria: string;
    marca: string;
  };
}

interface CompraAgrupada {
  fecha: string;
  total_compra: number;
  total_productos: number;
  direccion: string;
  metodo_pago: string;
  status: string;
  items: CompraItem[];
}

interface ApiResponse {
  success: boolean;
  compras?: CompraAgrupada[];
  estadisticas?: {
    total_compras: number;
    total_gastado: number;
    total_productos_comprados: number;
    compra_promedio: number;
  };
  error?: string;
  debug?: any;
}

export default function HistorialComprasScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [compras, setCompras] = useState<CompraAgrupada[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchHistorialCompras(user.uid);
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const fetchHistorialCompras = async (firebaseUid: string) => {
    try {
      setLoading(true);
      
      // Validar que el firebaseUid no esté vacío
      if (!firebaseUid || firebaseUid.trim() === '') {
        throw new Error('Firebase UID no válido');
      }

      // Construir la URL con el parámetro correctamente codificado
      const url = `https://felipe25.alwaysdata.net/api/historial.php?firebase_uid=${encodeURIComponent(firebaseUid)}`;
      
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setCompras(data.compras || []);
      } else {
        console.error('API Error:', data.error);
        console.error('Debug info:', data.debug);
        Alert.alert('Error', data.error || 'Error al cargar el historial');
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      Alert.alert('Error', `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (currentUser) {
      fetchHistorialCompras(currentUser.uid);
    } else {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return '#FF9800';
      case 'procesando':
        return '#2196F3';
      case 'enviado':
        return '#9C27B0';
      case 'entregado':
        return '#4CAF50';
      case 'cancelado':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'Pendiente';
      case 'procesando':
        return 'Procesando';
      case 'enviado':
        return 'Enviado';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const renderCompraItem = ({ item }: { item: CompraItem }) => (
    <ProductItemContainer>
      <ProductImageContainer>
        <ProductImage 
          uri={item.producto.imagenURL}
          style={{ width: '100%', height: '100%' }}
        />
      </ProductImageContainer>
      
      <ProductInfo>
        <ProductName>{item.producto.nombre}</ProductName>
        <ProductDetails>
          <ProductCategory>{item.producto.categoria}</ProductCategory>
          <ProductBrand>{item.producto.marca}</ProductBrand>
        </ProductDetails>
        <ProductQuantity>Cantidad: {item.canti_productos}</ProductQuantity>
        <ProductPrice>${item.subtotal.toFixed(2)}</ProductPrice>
      </ProductInfo>
    </ProductItemContainer>
  );

  const renderCompraAgrupada = ({ item }: { item: CompraAgrupada }) => (
    <CompraContainer>
      <CompraHeader>
        <CompraHeaderTop>
          <CompraDate>{formatDate(item.fecha)}</CompraDate>
          <StatusContainer>
            <StatusBadge statusColor={getStatusColor(item.status)}>
              <StatusText>{getStatusText(item.status)}</StatusText>
            </StatusBadge>
          </StatusContainer>
        </CompraHeaderTop>
        
        <CompraInfo>
          <CompraInfoRow>
            <CompraInfoLabel>Total productos:</CompraInfoLabel>
            <CompraInfoValue>{item.total_productos}</CompraInfoValue>
          </CompraInfoRow>
          <CompraInfoRow>
            <CompraInfoLabel>Método de pago:</CompraInfoLabel>
            <CompraInfoValue>{item.metodo_pago}</CompraInfoValue>
          </CompraInfoRow>
          <CompraInfoRow>
            <CompraInfoLabel>Dirección:</CompraInfoLabel>
            <CompraInfoValue numberOfLines={2}>{item.direccion}</CompraInfoValue>
          </CompraInfoRow>
        </CompraInfo>
      </CompraHeader>

      <ProductsList>
        {item.items.map((producto, index) => (
          <View key={index}>
            {renderCompraItem({ item: producto })}
          </View>
        ))}
      </ProductsList>

      <CompraFooter>
        <TotalRow>
          <TotalLabel>Total:</TotalLabel>
          <TotalValue>${item.total_compra.toFixed(2)}</TotalValue>
        </TotalRow>
        
        <CompraActions>
          <ActionButton onPress={() => Alert.alert('Detalles', 'Funcionalidad en desarrollo')}>
            <MaterialIcons name="info" size={16} color="#666" />
            <ActionButtonText>Detalles</ActionButtonText>
          </ActionButton>
          
          {item.status.toLowerCase() === 'entregado' && (
            <ActionButton onPress={() => Alert.alert('Calificar', 'Funcionalidad en desarrollo')}>
              <MaterialIcons name="star" size={16} color="#666" />
              <ActionButtonText>Calificar</ActionButtonText>
            </ActionButton>
          )}
        </CompraActions>
      </CompraFooter>
    </CompraContainer>
  );

  const EmptyState = () => (
    <EmptyContainer>
      <MaterialIcons name="shopping-bag" size={80} color="rgba(255,255,255,0.5)" />
      <EmptyText>No tienes compras realizadas</EmptyText>
      <EmptySubtext>Cuando realices tu primera compra aparecerá aquí</EmptySubtext>
      <ContinueShoppingButton onPress={() => router.back()}>
        <ContinueShoppingText>Comenzar a comprar</ContinueShoppingText>
      </ContinueShoppingButton>
    </EmptyContainer>
  );

  // Mostrar loading mientras se autentica
  if (loading) {
    return (
      <>
        <GradientBackground />
        <BlurredOverlay />
        <Container>
          <Header>
            <BackButton onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </BackButton>
            <HeaderTitle>Historial de Compras</HeaderTitle>
            <View style={{ width: 40 }} />
          </Header>
          <LoadingContainer>
            <MaterialIcons name="hourglass-empty" size={40} color="white" />
            <LoadingText>Cargando historial...</LoadingText>
          </LoadingContainer>
        </Container>
      </>
    );
  }

  // Mostrar mensaje si no hay usuario autenticado
  if (!currentUser) {
    return (
      <>
        <GradientBackground />
        <BlurredOverlay />
        <Container>
          <Header>
            <BackButton onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </BackButton>
            <HeaderTitle>Historial de Compras</HeaderTitle>
            <View style={{ width: 40 }} />
          </Header>
          <EmptyContainer>
            <MaterialIcons name="account-circle" size={80} color="rgba(255,255,255,0.5)" />
            <EmptyText>Inicia sesión para ver tu historial</EmptyText>
            <EmptySubtext>Necesitas estar autenticado para ver tus compras</EmptySubtext>
          </EmptyContainer>
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
          <HeaderTitle>Historial de Compras</HeaderTitle>
          <View style={{ width: 40 }} />
        </Header>

        <FlatList
          data={compras}
          renderItem={renderCompraAgrupada}
          keyExtractor={(item, index) => `${item.fecha}-${index}`}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
              colors={['white']}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
        />
      </Container>
    </>
  );
}

// Estilos (mismos que antes)
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

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
`;

const LoadingText = styled(Text)`
  color: white;
  font-size: 16px;
  margin-top: 10px;
`;

const CompraContainer = styled(View)`
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const CompraHeader = styled(View)`
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const CompraHeaderTop = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CompraDate = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const StatusContainer = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const StatusBadge = styled(View)<{ statusColor: string }>`
  background-color: ${props => props.statusColor};
  padding: 4px 8px;
  border-radius: 12px;
`;

const StatusText = styled(Text)`
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const CompraInfo = styled(View)`
  gap: 4px;
`;

const CompraInfoRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CompraInfoLabel = styled(Text)`
  font-size: 13px;
  color: #666;
  flex: 1;
`;

const CompraInfoValue = styled(Text)`
  font-size: 13px;
  color: #333;
  font-weight: 500;
  flex: 2;
  text-align: right;
`;

const ProductsList = styled(View)`
  padding: 0 16px;
`;

const ProductItemContainer = styled(View)`
  flex-direction: row;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: #f5f5f5;
`;

const ProductImageContainer = styled(View)`
  width: 50px;
  height: 50px;
  background-color: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  margin-right: 12px;
`;

const ProductInfo = styled(View)`
  flex: 1;
`;

const ProductName = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const ProductDetails = styled(View)`
  flex-direction: row;
  gap: 8px;
  margin-bottom: 4px;
`;

const ProductCategory = styled(Text)`
  font-size: 11px;
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
`;

const ProductBrand = styled(Text)`
  font-size: 11px;
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
`;

const ProductQuantity = styled(Text)`
  font-size: 12px;
  color: #777;
  margin-bottom: 4px;
`;

const ProductPrice = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: #E24329;
`;

const CompraFooter = styled(View)`
  padding: 16px;
  background-color: #f9f9f9;
`;

const TotalRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TotalLabel = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const TotalValue = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: #E24329;
`;

const CompraActions = styled(View)`
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  border-width: 1px;
  border-color: #ddd;
`;

const ActionButtonText = styled(Text)`
  font-size: 12px;
  color: #666;
  margin-left: 4px;
`;

const EmptyContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
`;

const EmptyText = styled(Text)`
  font-size: 20px;
  color: white;
  font-weight: bold;
  margin-top: 20px;
`;

const EmptySubtext = styled(Text)`
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