import { router } from "expo-router";
import { default as styled } from "styled-components/native";


export default function index() {
    return (
        <Container>
            <Icono source="https://i.postimg.cc/XqTrYg1K/cinta-metrica.png"/>
                <Titulo>Inicio de Conversor</Titulo>
                <Titulo>sirve???</Titulo>
                <SubTitulo>(cm) a (m)</SubTitulo>
                <BotonInicio onPress={()=>router.push("conversor")}>
                    <TextoBoton>convertir</TextoBoton>
                </BotonInicio>
                <Botonregresar onPress={()=>router.back("index")}>
                    <TextoBoton>Regresar</TextoBoton>
                </Botonregresar>
        </Container>
    );
}


const Container = styled.View`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: rgba(101, 19, 195, 0.5);
`;
const Titulo = styled.Text`
    font-size: 50px;
    font-weight: bold;
    margin-bottom: 20px;
    color: rgba(3, 7, 7, 0.58);
`;
const SubTitulo = styled.Text`
    font-size: 50px;
    font-weight: bold;
    margin-bottom: 20px;
    color: rgba(14, 240, 14, 0.58);
`;

const TextoBoton = styled.Text`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    color: rgba(3, 7, 7, 0.58);
`;
const Icono = styled.Image`
    width: 150px;
    height: 150px;
    margin-buttom:20px;
    `;
    
const BotonInicio = styled.Text`
    background-color: rgba(234, 6, 234, 0.8);
    padding: 15px 30px;
    border-radius: 8px;
`;
const Botonregresar = styled.Text`
    background-color: rgba(234, 6, 234, 0.8);
    padding: 15px 30px;
    margin-top: 40px;
    border-radius: 8px;
`;