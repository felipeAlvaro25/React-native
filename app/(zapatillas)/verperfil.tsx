import { useRouter } from "expo-router";
import { Button, TouchableOpacity } from "react-native";
import { styled } from "styled-components/native";
import { useTexto } from "./TextoContext";

export default function ShowPerfil() {
  const router = useRouter();
  const { texto } = useTexto();
  
  const nombre = texto?.nombre || "No especificado";
  const pais = texto?.pais || "No especificado";
  const correo = texto?.correo || "No especificado";
    
  const onpress = () => {
  };

  return (
    <Container>
      <TouchableOpacity onPress={onpress}>
        <Titulo>DESARROLLO WEB II</Titulo>
      </TouchableOpacity>
      <Texto>Bienvenid@</Texto>
      <Textnombre>{nombre}</Textnombre>
      
      <SeccionValidacion>
        <Texto2>Validación de datos:</Texto2>
        <DatoItem>
          <Etiqueta>País: </Etiqueta>
          <Valor>{pais}</Valor>
        </DatoItem>
        <DatoItem>
          <Etiqueta>Correo: </Etiqueta>
          <Valor>{correo}</Valor>
        </DatoItem>
      </SeccionValidacion>
      
      <Button
        title="Volver"
        onPress={() => {
          router.back();
        }}
      />
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color:rgba(119, 0, 255, 0.27);
`;

const Titulo = styled.Text`
  font-size: 40px;
  font-weight: bold;
  color: rgb(0, 0, 0);
  margin-bottom: 20px;
  text-align: center;
`;
const Texto = styled.Text`
  font-size: 25px;
  color: rgb(0, 0, 0);
  margin-bottom: 15px;
  text-align: center;
`;

const Texto2 = styled.Text`
  font-size: 20px;
  color: rgb(0, 0, 0);
  margin-bottom: 15px;
  text-align: center;
`;

const Textnombre = styled.Text`
  font-size: 35px;
  font-weight: bold;
  color: rgba(251, 14, 14, 0.8);
  margin-bottom: 30px;
  text-align: center;
`;

const SeccionValidacion = styled.View`
  width: 30%;
  margin-bottom: 40px;
  padding: 20px;
  background-color:  rgba(12, 83, 83, 0.24);
  border-radius: 10px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const DatoItem = styled.View`
  flex-direction: row;
  margin-bottom: 10px;
  align-items: center;
`;

const Etiqueta = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  min-width: 80px;
`;

const Valor = styled.Text`
  font-size: 18px;
  color: rgb(0, 0, 0);
  flex: 1;
`;