import { router } from "expo-router";
import { Image, TouchableOpacity } from "react-native"; // Import TouchableOpacity
import { LinearGradient } from 'expo-linear-gradient';
import { default as styled } from "styled-components/native";

export default function Ropa() {
  return (
    <Container>
      {/* You had an empty tag here, I've removed it assuming it was unintentional */}
      {/* If you intended to have a Logo, uncomment the line below and ensure 'Logo' is defined */}
      {/* <Logo source={require('../assets/your-logo.png')} /> */} 

      <Titulo>Sección de Ropa</Titulo>

      {/* Wrap Boton with TouchableOpacity */}
      <TouchableOpacity onPress={() => router.push("/caballeros")} activeOpacity={0.7}>
        <Boton>
          <TextoBoton>Caballero</TextoBoton>
        </Boton>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/damas")} activeOpacity={0.7}>
        <Boton>
          <TextoBoton>Dama</TextoBoton>
        </Boton>
      </TouchableOpacity>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: #f4f1ea;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Logo = styled(Image)`
  width: 180px;
  height: 180px;
  margin-bottom: 30px;
  border-radius: 90px;
`;

const Titulo = styled.Text`
  color: #3e3a36;
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40px;
`;

const Boton = styled(LinearGradient).attrs({
  colors: ['rgba(123, 142, 138, 0.85)', 'rgba(64, 28, 75, 0.85)'], // tus dos colores
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  padding: 16px 40px;
  border-radius: 30px;
  margin-vertical: 10px;
  align-items: center;
  elevation: 3;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  width: 80%;
`;

const TextoBoton = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`;