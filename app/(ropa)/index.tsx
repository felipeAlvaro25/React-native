import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { default as styled } from "styled-components/native";

export default function Ropa() {
  return (
    <Container>
      <Titulo>Sección de Ropa</Titulo>

      <Boton onPress={() => router.push("/Caballero")}>
        <TextoBoton>Caballero</TextoBoton>
      </Boton>

      <Boton onPress={() => router.push("/Dama")}>
        <TextoBoton>Dama</TextoBoton>
      </Boton>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: #FFF5F5;  /* Fondo pastel rosado muy claro */
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Titulo = styled.Text`
  color: #8B0000;  /* Rojo oscuro */
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40px;
`;

const Boton = styled(TouchableOpacity)`
  background-color: #C00000;  /* Rojo vibrante */
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
  color: #FFFFFF;  /* Blanco */
  font-size: 18px;
  font-weight: bold;
`;