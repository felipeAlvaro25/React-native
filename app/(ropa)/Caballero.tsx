import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styled } from "styled-components/native";
import { auth } from '../../Firebase/firebaseconfig';

// Types
type AppRoute = "/(admin)" | "/(zapatillas)" | "/(ropa)" | "/(reloj)";
type Ruta = {
    name: string;
    href: AppRoute;
};
type Producto = {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    categoria: 'Deportiva' | 'Jeans' | 'Gala' | 'Abrigo' | 'Popular';
    tipo: 'Jeans' | 'Abrigo' | 'Sueter' | 'Deportiva' | 'Gala';
    imagenURL?: string | null;
    color?: string;
    talla?: string;
    esPopular: boolean;
    marca?: string;
};
type ViewMode = 'single' | 'double';

// Constants
const API_URL = 'https://felipe25.alwaysdata.net/api/ropa-caballero.php ';
const { width: screenWidth } = Dimensions.get('window');

// Categorías del filtro
const categorias = [
    { id: 'Todos', nombre: 'Todos' },
    { id: 'Popular', nombre: 'Popular' },
    { id: 'Jeans', nombre: 'Jeans' },
    { id: 'Abrigo', nombre: 'Abrigos' },
    { id: 'Sueter', nombre: 'Súeteres' },
    { id: 'Deportiva', nombre: 'Deportiva' },
    { id: 'Gala', nombre: 'Gala' }
];

export default function Caballero() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('double');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');

    // Animaciones
    const sidebarAnimation = useRef(new Animated.Value(-screenWidth * 0.8)).current;
    const overlayAnimation = useRef(new Animated.Value(0)).current;

    // Menú lateral
    const datarutas: Ruta[] = [
        { name: "Zapatillas", href: "/(zapatillas)" },
        { name: "Ropa", href: "/(ropa)" },
        { name: "Reloj", href: "/(reloj)" },
        { name: "Admin", href: "/(admin)" },
    ];

    // Función para cargar productos desde el backend
    const cargarProductos = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}?categoria=Caballero`;

            if (categoriaFiltro === 'Popular') {
                url += '&opular=true&limit=6'; // Popular y máximo 6
            } else if (categoriaFiltro !== 'todos') {
                url += `&tipo=${categoriaFiltro}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.success) {
                setProductos(data.productos);
            } else {
                throw new Error(data.message || 'Error loading products');
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            Alert.alert('Error', 'No se pudieron cargar los productos.');
        } finally {
            setLoading(false);
        }
    };

    // Abrir menú lateral
    const openSidebar = () => {
        setSidebarVisible(true);
        Animated.parallel([
            Animated.timing(sidebarAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Cerrar menú lateral
    const closeSidebar = () => {
        Animated.parallel([
            Animated.timing(sidebarAnimation, {
                toValue: -screenWidth * 0.8,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setSidebarVisible(false);
        });
    };

    // Renderizar un producto en vista simple
    const renderProductoSingle = ({ item }: { item: Producto }) => (
        <ProductoContainer>
            <ProductoImageContainer>
                {item.imagenURL ? (
                    <ProductoImage source={{ uri: item.imagenURL }} />
                ) : (
                    <PlaceholderImage><MaterialIcons name="image" size={30} color="white" /></PlaceholderImage>
                )}
                {item.esPopular && <PopularBadge><PopularBadgeText>POPULAR</PopularBadgeText></PopularBadge>}
            </ProductoImageContainer>
            <ProductoInfo>
                <ProductoNombre>{item.nombre}</ProductoNombre>
                <ProductoDescripcion>{item.descripcion}</ProductoDescripcion>
                <ProductoDetailsContainer>
                    <ProductoPrecio>${item.precio.toFixed(2)}</ProductoPrecio>
                    <ProductoStock>{item.stock > 0 ? 'En stock' : 'Agotado'}</ProductoStock>
                </ProductoDetailsContainer>
                <CategoriaBadge categoria={item.tipo}>
                    <CategoriaBadgeText>{item.tipo.toUpperCase()}</CategoriaBadgeText>
                </CategoriaBadge>
            </ProductoInfo>
        </ProductoContainer>
    );

    // Renderizar un producto en vista doble
    const renderProductoDouble = ({ item }: { item: Producto }) => (
        <ProductoContainerDouble>
            <ProductoImageContainerDouble>
                {item.imagenURL ? (
                    <ProductoImage source={{ uri: item.imagenURL }} />
                ) : (
                    <PlaceholderImageDouble><MaterialIcons name="image" size={30} color="white" /></PlaceholderImageDouble>
                )}
                {item.esPopular && <PopularBadgeDouble><PopularBadgeText>POPULAR</PopularBadgeText></PopularBadgeDouble>}
            </ProductoImageContainerDouble>
            <ProductoInfoDouble>
                <ProductoNombreDouble>{item.nombre}</ProductoNombreDouble>
                <ProductoDescripcionDouble numberOfLines={2}>{item.descripcion}</ProductoDescripcionDouble>
                <ProductoDetailsContainerDouble>
                    <ProductoPrecioDouble>${item.precio.toFixed(2)}</ProductoPrecioDouble>
                    <ProductoStockDouble>{item.stock > 0 ? 'En stock' : 'Agotado'}</ProductoStockDouble>
                </ProductoDetailsContainerDouble>
                <CategoriaBadgeDouble categoria={item.tipo}>
                    <PopularBadgeText>{item.tipo}</PopularBadgeText>
                </CategoriaBadgeDouble>
            </ProductoInfoDouble>
        </ProductoContainerDouble>
    );

    // Efecto para cargar productos al cambiar filtro
    useEffect(() => {
        cargarProductos();
    }, [categoriaFiltro]);

    return (
        <>
            {/* Background Gradient */}
            <GradientBackground />

            {/* Blurred Overlay */}
            <BlurredOverlay />

            {/* Main Content */}
            <MainScrollView showsVerticalScrollIndicator={false}>
                <Container>
                    <HeaderSection>
                        <HeaderTopRow>
                            <MenuButton onPress={openSidebar}>
                                <MaterialIcons name="menu" size={28} color="white" />
                            </MenuButton>
                            <SignOutButton onPress={() => auth.signOut()}>
                                <ButtonText>Cerrar sesión</ButtonText>
                                <AntDesign name="logout" size={18} color="white" style={{ marginLeft: 8 }} />
                            </SignOutButton>
                        </HeaderTopRow>
                        <WelcomeText>¡Bienvenido!</WelcomeText>
                    </HeaderSection>

                    <SectionContainer>
                        <SectionHeader>
                            <Titulo>Ropa para Caballero</Titulo>
                            <FilterScroll horizontal showsHorizontalScrollIndicator={false}>
                                {categorias.map(cat => (
                                    <FilterButton
                                        key={cat.id}
                                        active={categoriaFiltro === cat.id}
                                        onPress={() => setCategoriaFiltro(cat.id)}
                                    >
                                        <FilterText active={categoriaFiltro === cat.id}>
                                            {cat.nombre}
                                        </FilterText>
                                    </FilterButton>
                                ))}
                            </FilterScroll>
                            <ViewModeContainer>
                                <ViewModeButton 
                                    active={viewMode === 'single'}
                                    onPress={() => setViewMode('single')}
                                >
                                    <MaterialIcons name="view-agenda" size={18} color={viewMode === 'single' ? '#fff' : '#E53935'} />
                                    <ViewModeText active={viewMode === 'single'}>Una columna</ViewModeText>
                                </ViewModeButton>
                                <ViewModeButton 
                                    active={viewMode === 'double'}
                                    onPress={() => setViewMode('double')}
                                >
                                    <MaterialIcons name="view-module" size={18} color={viewMode === 'double' ? '#fff' : '#E53935'} />
                                    <ViewModeText active={viewMode === 'double'}>Dos columnas</ViewModeText>
                                </ViewModeButton>
                            </ViewModeContainer>
                        </SectionHeader>

                        {loading ? (
                            <LoadingContainer>
                                <ActivityIndicator size="large" color="#E53935" />
                                <LoadingText>Cargando productos...</LoadingText>
                            </LoadingContainer>
                        ) : productos.length > 0 ? (
                            <ProductsList 
                                data={productos}
                                renderItem={viewMode === 'single' ? renderProductoSingle : renderProductoDouble}
                                keyExtractor={(item) => item.id}
                                numColumns={viewMode === 'double' ? 2 : 1}
                                key={viewMode + categoriaFiltro}
                                columnWrapperStyle={viewMode === 'double' ? { justifyContent: 'space-between' } : undefined}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <NoProductsContainer>
                                <NoProductsText>No hay productos disponibles</NoProductsText>
                                <MaterialIcons name="search-off" size={40} color="#E53935" />
                            </NoProductsContainer>
                        )}
                    </SectionContainer>

                    <FooterContainer>
                        <AntDesign name="gitlab" size={60} color="#E53935"/>
                        <FooterText>Colección Caballero 2023</FooterText>
                    </FooterContainer>
                </Container>
            </MainScrollView>

            {/* Sidebar */}
            {sidebarVisible && (
                <>
                    <SidebarOverlay 
                        as={Animated.View}
                        style={{ opacity: overlayAnimation }}
                        onTouchEnd={closeSidebar}
                        activeOpacity={1}
                    />
                    <SidebarContainer
                        as={Animated.View}
                        style={{
                            transform: [{ translateX: sidebarAnimation }]
                        }}
                    >
                        <SidebarHeader>
                            <SidebarCloseButton onPress={closeSidebar}>
                                <MaterialIcons name="close" size={28} color="white" />
                            </SidebarCloseButton>
                            <SidebarTitle>Menú</SidebarTitle>
                        </SidebarHeader>
                        <SidebarContent>
                            <SidebarMenuList 
                                data={datarutas} 
                                renderItem={({ item }) => (
                                    <SidebarLinkButton onPress={() => {}}>
                                        <SidebarIconContainer>
                                            <MaterialIcons name="shopping-bag" size={24} color="white" />
                                        </SidebarIconContainer>
                                        <SidebarTextContainer>
                                            <SidebarTexto>{item.name}</SidebarTexto>
                                        </SidebarTextContainer>
                                        <Flecha name="chevron-right" size={20} />
                                    </SidebarLinkButton>
                                )}
                                keyExtractor={(item) => item.name}
                                scrollEnabled={false}
                            />
                        </SidebarContent>
                        <SidebarFooter>
                            <AntDesign name="gitlab" size={40} color="white"/>
                        </SidebarFooter>
                    </SidebarContainer>
                </>
            )}
        </>
    );
}
export default Caballero;

const GradientBackground = styled(LinearGradient).attrs({
  colors: ['rgba(255, 235, 238, 0.9)', 'rgba(255, 245, 245, 0.9)'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

const BlurredOverlay = styled(BlurView).attrs({
  intensity: 30,
  tint: "light",
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

const MainScrollView = styled(ScrollView)`
  flex: 1;
  z-index: 1;
  margin-bottom: 60px;
`;

const Container = styled(View)`
    flex: 1;
    padding-bottom: 5px;
`;

const HeaderSection = styled(View)`
    padding: 20px;
    padding-top: 40px;
    background-color: #E53935;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    shadow-color: #000;
    shadow-offset: 0px 5px;
    shadow-opacity: 0.2;
    shadow-radius: 10px;
    elevation: 5;
`;

const HeaderTopRow = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
`;

const MenuButton = styled(TouchableOpacity)`
    padding: 8px;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.2);
`;

const SectionContainer = styled(View)`
    padding: 20px;
`;

const SectionHeader = styled(View)`
    align-items: center;
    margin-bottom: 20px;
`;

const WelcomeText = styled(Text)`
    font-size: 18px;
    color: white;
    font-weight: 600;
    text-align: center;
`;

const SignOutButton = styled(TouchableOpacity)`
    background-color: #C62828;
    padding: 12px 20px;
    border-radius: 25px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    min-width: 150px;
    height: 45px;
`;

const ButtonText = styled(Text)`
    color: white;
    font-weight: 600;
    font-size: 16px;
`;

const Titulo = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #E53935;
    text-align: center;
`;

const FilterScroll = styled(ScrollView).attrs({
    horizontal: true,
    showsHorizontalScrollIndicator: false,
})`
    margin-bottom: 15px;
    padding-horizontal: 5px;
    max-height: 50px;
`;

const FilterButton = styled(TouchableOpacity)<{ active: boolean }>`
    padding: 8px 16px;
    margin-horizontal: 5px;
    border-radius: 20px;
    background-color: ${props => props.active ? '#E53935' : 'rgba(255, 235, 238, 0.9)'};
    border: 1px solid ${props => props.active ? '#C62828' : 'rgba(229, 57, 53, 0.3)'};
`;

const FilterText = styled(Text)<{ active: boolean }>`
    color: ${props => props.active ? 'white' : '#E53935'};
    font-weight: ${props => props.active ? '600' : '500'};
    font-size: 14px;
`;

const ViewModeContainer = styled(View)`
    flex-direction: row;
    background-color: rgba(229, 57, 53, 0.1);
    border-radius: 20px;
    padding: 4px;
    margin-bottom: 15px;
`;

const ViewModeButton = styled(TouchableOpacity)<{ active: boolean }>`
    flex-direction: row;
    align-items: center;
    padding: 10px 16px;
    border-radius: 18px;
    background-color: ${props => props.active ? '#E53935' : 'transparent'};
    margin: 0 2px;
`;

const ViewModeText = styled(Text)<{ active: boolean }>`
    color: ${props => props.active ? '#fff' : '#E53935'};
    font-weight: ${props => props.active ? '600' : '400'};
    margin-left: 6px;
    font-size: 13px;
`;

const ProductsList = styled(FlatList)`
    flex-grow: 0;
`;

const LoadingContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 40px 0;
`;

const LoadingText = styled(Text)`
    font-size: 16px;
    color: #E53935;
    margin-top: 10px;
`;

const NoProductsContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 40px;
    background-color: rgba(255, 235, 238, 0.7);
    border-radius: 15px;
`;

const NoProductsText = styled(Text)`
    font-size: 18px;
    color: #E53935;
    text-align: center;
    margin-bottom: 15px;
    font-weight: 500;
`;

const FooterContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: rgba(229, 57, 53, 0.1);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    margin-top: 20px;
`;

const FooterText = styled(Text)`
    font-size: 14px;
    color: #E53935;
    margin-top: 10px;
`;

// Estilos del Sidebar
const SidebarOverlay = styled(TouchableOpacity)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
`;

const SidebarContainer = styled(View)`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${screenWidth * 0.8}px;
    background-color: #E53935;
    z-index: 1001;
    shadow-color: #000;
    shadow-offset: 2px 0px;
    shadow-opacity: 0.3;
    shadow-radius: 10px;
    elevation: 10;
`;

const SidebarHeader = styled(View)`
    flex-direction: row;
    align-items: center;
    padding: 20px;
    padding-top: 50px;
    background-color: #C62828;
    border-bottom-width: 1px;
    border-bottom-color: rgba(255, 255, 255, 0.2);
`;

const SidebarCloseButton = styled(TouchableOpacity)`
    padding: 8px;
    margin-right: 15px;
`;

const SidebarTitle = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    color: white;
`;

const SidebarContent = styled(View)`
    flex: 1;
    padding: 20px;
`;

const SidebarFooter = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-top-width: 1px;
    border-top-color: rgba(255, 255, 255, 0.2);
`;

// Botones del sidebar
const SidebarLinkButton = styled(TouchableOpacity)`
    flex-direction: row;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.1);
    height: 60px;
`;

const SidebarIconContainer = styled(View)`
    width: 40px;
    align-items: center;
    justify-content: center;
`;

const SidebarTextContainer = styled(View)`
    flex: 1;
    align-items: flex-start;
    justify-content: center;
    margin-left: 10px;
`;

const SidebarTexto = styled(Text)`
    font-size: 16px;
    font-weight: 600;
    text-transform: capitalize;
    color: white;
`;

const SidebarMenuList = styled(FlatList)`
    flex-grow: 0;
`;

const Flecha = styled(Entypo)`
    color: rgba(255, 255, 255, 0.8);
`;

const Primero = styled(AntDesign)`
    color: white;
`;

// Estilos para productos - Vista single
const ProductoContainer = styled(View)`
    flex-direction: row;
    background-color: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    elevation: 3;
    min-height: 140px;
    border-left-width: 4px;
    border-left-color: #E53935;
`;

const ProductoImageContainer = styled(View)`
    width: 120px;
    height: 120px;
    margin-right: 16px;
    border-radius: 10px;
    overflow: hidden;
    background-color: #f5f5f5;
`;

const ProductoImage = styled(Image)`
    width: 100%;
    height: 100%;
`;

const PlaceholderImage = styled(View)`
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
`;

const ProductoInfo = styled(View)`
    flex: 1;
    justify-content: space-between;
    padding-vertical: 4px;
`;

const ProductoNombre = styled(Text)`
    font-size: 17px;
    font-weight: bold;
    color: #333;
    line-height: 22px;
`;

const ProductoDescripcion = styled(Text)`
    font-size: 14px;
    color: #666;
    line-height: 18px;
    margin-vertical: 8px;
`;

const ProductoAtributosContainer = styled(View)`
    flex-direction: row;
    margin-vertical: 5px;
    flex-wrap: wrap;
`;

const ProductoAtributo = styled(View)`
    flex-direction: row;
    align-items: center;
    margin-right: 10px;
    margin-bottom: 5px;
    background-color: #f5f5f5;
    padding: 3px 8px;
    border-radius: 10px;
`;

const ProductoAtributoText = styled(Text)`
    font-size: 12px;
    color: #666;
    margin-left: 4px;
`;

const ProductoColorCircle = styled(View)<{ color: string }>`
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background-color: ${props => props.color};
    border: 1px solid #ddd;
`;

const ProductoDetailsContainer = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
`;

const ProductoPrecio = styled(Text)`
    font-size: 18px;
    font-weight: bold;
    color: #E53935;
`;

const ProductoStock = styled(Text)`
    font-size: 13px;
    color: #4CAF50;
    font-weight: 500;
    background-color: #E8F5E8;
    padding: 4px 8px;
    border-radius: 12px;
`;

const CategoriaBadge = styled(View)<{ categoria: string }>`
    align-self: flex-start;
    margin-top: 8px;
    padding: 4px 8px;
    border-radius: 12px;
    background-color: ${props => {
        switch(props.categoria) {
            case 'popular': return '#FFC107';
            case 'deportiva': return '#4CAF50';
            case 'jeans': return '#2196F3';
            case 'de gala': return '#9C27B0';
            case 'sueter': return '#FF9800';
            case 'abrigo': return '#795548';
            default: return '#E53935';
        }
    }};
`;

const CategoriaBadgeText = styled(Text)`
    font-size: 12px;
    color: white;
    font-weight: 500;
`;

// Estilos para productos - Vista double
const ProductoContainerDouble = styled(View)`
    background-color: white;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    elevation: 3;
    width: 47%;
    min-height: 320px;
    border-top-width: 4px;
    border-top-color: #E53935;
`;

const ProductoImageContainerDouble = styled(View)`
    width: 100%;
    height: 150px;
    margin-bottom: 12px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #f5f5f5;
`;

const PlaceholderImageDouble = styled(View)`
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
`;

const ProductoInfoDouble = styled(View)`
    flex: 1;
    justify-content: space-between;
`;

const ProductoNombreDouble = styled(Text)`
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-bottom: 6px;
    line-height: 18px;
`;

const ProductoDescripcionDouble = styled(Text)`
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    line-height: 16px;
`;

const ProductoDetailsContainerDouble = styled(View)`
    margin-top: auto;
`;

const ProductoPrecioDouble = styled(Text)`
    font-size: 16px;
    font-weight: bold;
    color: #E53935;
    margin-bottom: 4px;
`;

const ProductoStockDouble = styled(Text)`
    font-size: 11px;
    color: #4CAF50;
    font-weight: 500;
    background-color: #E8F5E8;
    padding: 3px 6px;
    border-radius: 10px;
    align-self: flex-start;
`;

const CategoriaBadgeDouble = styled(View)<{ categoria: string }>`
    align-self: flex-start;
    margin-top: 8px;
    padding: 3px 6px;
    border-radius: 10px;
    background-color: ${props => {
        switch(props.categoria) {
            case 'popular': return '#FFC107';
            case 'deportiva': return '#4CAF50';
            case 'jeans': return '#2196F3';
            case 'de gala': return '#9C27B0';
            case 'sueter': return '#FF9800';
            case 'abrigo': return '#795548';
            default: return '#E53935';
        }
    }};
`;

// Nuevos estilos para el badge Popular
const PopularBadge = styled(View)`
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #FFC107;
    padding: 4px 8px;
    border-radius: 12px;
    z-index: 2;
`;

const PopularBadgeDouble = styled(View)`
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: #FFC107;
    padding: 3px 6px;
    border-radius: 10px;
    z-index: 2;
`;

const PopularBadgeText = styled(Text)`
    font-size: 10px;
    color: #000;
    font-weight: bold;
`;
