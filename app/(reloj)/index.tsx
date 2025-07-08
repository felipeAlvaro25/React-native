import { Image, TouchableOpacity } from "react-native";
import { default as styled } from "styled-components/native";
export default function Relog() {
  return (
    <Container>
      <Image
        source={require("./imagen/logv2.png")}
        style={{ width: 200, height: 200 }}
      />
      <Texto>Sesión de Relojes</Texto>

      <Boton >
        <TextoBoton>Gama Alta</TextoBoton>
      </Boton>

      <Boton >
        <TextoBoton>Gama Media</TextoBoton>
      </Boton>

      <Boton >
        <TextoBoton>Gama Baja</TextoBoton>
      </Boton>
      
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: #FFD700;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Texto = styled.Text`
  color: #604A1B;
  font-size: 40px;
  font-weight: bold;
  margin-bottom: 30px;
  
`;

const Boton = styled(TouchableOpacity)`
  background-color: #604A1B;
  padding: 15px 30px;
  border-radius: 50px;
  margin: 10px;
  border:2px solid rgb(241, 240, 231);
`;

const TextoBoton = styled.Text`
  color:rgb(211, 176, 101);
  font-size: 18px;
  font-weight: bold;
`;
