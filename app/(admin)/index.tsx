import { Alert } from 'react-native';
import { styled } from 'styled-components/native';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons

export default function AdminDashboardCards() {
  return (
    <Container>
      <Title>Gestión de Inventario</Title>

      <CardContainer>
        {/* --- Product Management Card --- */}
        <ManagementCard>
          <CardHeader>
            <MaterialCommunityIcons name="package-variant" size={40} color="#6a1b9a" />
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <ButtonWrapper>
            <Link href="/(admin)/productos/agregar-producto" asChild>
              <AuthButton>
                <ButtonText>Agregar Producto</ButtonText>
              </AuthButton>
            </Link>
            <Link href="/(admin)/productos/modificar-producto" asChild>
              <AuthButton>
                <ButtonText>Modificar Producto</ButtonText>
              </AuthButton>
            </Link>
            <Link href="/(admin)/productos/eliminar-producto" asChild>
              <AuthButton>
                <ButtonText>Eliminar Producto</ButtonText>
              </AuthButton>
            </Link>
          </ButtonWrapper>
        </ManagementCard>

        {/* --- Supplier Management Card --- */}
        <ManagementCard>
          <CardHeader>
            <MaterialCommunityIcons name="truck-delivery-outline" size={40} color="#6a1b9a" />
            <CardTitle>Proveedores</CardTitle>
          </CardHeader>
          <ButtonWrapper>
            <Link href="/(admin)/proveedores/agregar-proveedores" asChild>
              <AuthButton>
                <ButtonText>Agregar Proveedor</ButtonText>
              </AuthButton>
            </Link>
            <Link href="/(admin)/proveedores/modificar-proveedores" asChild>
              <AuthButton>
                <ButtonText>Modificar Proveedor</ButtonText>
              </AuthButton>
            </Link>
          </ButtonWrapper>
        </ManagementCard>

        {/* --- Product Type Management Card --- */}
        <ManagementCard>
          <CardHeader>
            <MaterialCommunityIcons name="tag-multiple-outline" size={40} color="#6a1b9a" />
            <CardTitle>Tipo de Producto</CardTitle>
          </CardHeader>
          <ButtonWrapper>
            <Link href="/(admin)/tipo-productos/agregar-tipo-productos" asChild>
              <AuthButton>
                <ButtonText>Agregar Tipo de Producto</ButtonText>
              </AuthButton>
            </Link>
            <Link href="/(admin)/tipo-productos/modificar-tipo-productos" asChild>
              <AuthButton>
                <ButtonText>Modificar Tipo de Producto</ButtonText>
              </AuthButton>
            </Link>
          </ButtonWrapper>
        </ManagementCard>
      </CardContainer>
    </Container>
  );
}

// --- Styled Components (adjusted for cards) ---

const Container = styled.View`
  flex: 1;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  color: #333;
`;

const CardContainer = styled.ScrollView`
  flex: 1;
  padding-top: 10px;
`;

const ManagementCard = styled.View`
  background-color: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.1;
  shadow-radius: 6px;
  elevation: 8;
  align-items: center;
`;

const CardHeader = styled.View`
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
`;

const CardTitle = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-top: 10px;
`;

const ButtonWrapper = styled.View`
  width: 100%;
  gap: 10px;
`;

const AuthButton = styled.TouchableOpacity`
  background-color: #6a1b9a;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  &:active {
    background-color: #4a0d6e;
  }
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;