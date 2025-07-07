import { default as styled } from "styled-components/native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";

export default function Index() {
    const [centimetros, setCentimetros] = useState("");
    const [resultado, setResultado] = useState(null);
    
    useFocusEffect(
        useCallback(() => {
            setCentimetros("");
            setResultado(null);
        }, [])
    );

    const convertirAMetros = () => {
        if (!centimetros) {
            if (Platform.OS === "web") {
                window.alert("Introduzca un valor en centimetros");
            } else {
                Alert.alert("Error", "Introduzca un valor en centimetros");
            }
            return;
        }
        
        const cm = parseFloat(centimetros);
        if (isNaN(cm)) {
            setResultado("Valor inválido");
            return;
        }
        
        const metros = cm / 100;
        setResultado(`${cm} cm = ${metros} m`);
    };

    return (
        <Container>
            <Texto>Ingrese los Centímetros</Texto>
            <Input 
                placeholder="centímetros (CM)" 
                keyboardType="numeric"
                value={centimetros}
                onChangeText={setCentimetros}
            />
            <Seccionconversion>
                <BotonCalcular onPress={convertirAMetros}>
                    <TextoBoton>Convertir</TextoBoton>
                </BotonCalcular>
            
                <ResultadoTexto>Resultado: {resultado}</ResultadoTexto>
            
                <BotonRegresar onPress={() => router.back("conversor")}>
                    <TextoBoton>Regresar</TextoBoton>
                </BotonRegresar>
            </Seccionconversion>
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

const ResultadoTexto = styled.Text`
    font-size: 30px;
    font-weight: bold;
    margin: 20px 0;
    color: rgba(0, 0, 0, 0.8);
    text-align: center;
`;

const Texto = styled.Text`
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 20px;
    color: rgba(240, 14, 14, 0.68);
    text-align: center;
`;

const TextoBoton = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: rgb(3, 7, 7);
`;

const BotonCalcular = styled.Pressable`
    background-color: rgba(6, 234, 219, 0.8);
    padding: 15px 30px;
    border-radius: 8px;
    margin-bottom: 20px;
`;

const BotonRegresar = styled.Pressable`
    background-color: rgba(234, 6, 154, 0.8);
    padding: 15px 30px;
    border-radius: 8px;
`;

const Input = styled.TextInput`
    width: 30%;
    padding: 15px;
    margin-bottom: 20px;
    border-width: 1px;
    border-color: #ccc;
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    font-size: 18px;
`;
const Seccionconversion = styled.View`
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