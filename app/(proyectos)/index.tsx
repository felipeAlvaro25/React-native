import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Image, TouchableOpacity } from "react-native";
import { styled, ThemeProvider } from "styled-components/native";
import { temaclaro, temaoscuro } from "../../style/theme";

export default function Pantalla1() {
    const [istemaoscuro, setIstemaoscuro] = useState(false);
    const router = useRouter();
    const [count, setCount] = useState(0);
    
    const toggleTheme = () => {
        setIstemaoscuro((prevTheme) => !prevTheme);
    }
    
    const currentTheme = istemaoscuro ? temaoscuro : temaclaro;
    
    const data = {
        nombre: "Felipe",
        curso: "React-native"
    }
    
    const onpress = () => setCount(prev => prev + 1);
    
    return (
        <ThemeProvider theme={currentTheme}>
            <Container>
                <Image 
                    source={require("../imagen.jpg")} 
                    style={{ width: 300, height: 300 }} 
                />
                <TouchableOpacity onPress={onpress}>
                    <Texto>CONTADOR</Texto>
                </TouchableOpacity>
                <Texto>Bienvenidos a Pantalla 1</Texto>
                <Texto>HOLA SOY CHRIS</Texto>
                <Texto>Hola de nuevo</Texto>
                <Texto>Hola de nuevo felipe</Texto>
                <Texto>ya wey soy cesar</Texto>
                <Text>mira</Text>
                <Text>prueva de ajuste</Text>
                <StyledInput
                    placeholder="Escribe algo"
                    placeholderTextColor={currentTheme.Colors.text}
                />
                <Button 
                    title="Ir a Pantalla 2" 
                    onPress={() => router.push({
                        pathname: "/pantalla2",
                        params: data
                    })} 
                />
                <Button 
                    title="Ir a Pantalla Perfil" 
                    onPress={() => router.push({
                        pathname: "/perfil",
                        params: data
                    })} 
                />
                <Button 
                    title="Cambiar Tema" 
                    onPress={toggleTheme} 
                />
                <Texto>{count}</Texto>
            </Container>
        </ThemeProvider>
    );
}

const Texto = styled.Text`
    color: #3355ff;
    font-size: 40px;
    font-weight: bold;
    margin-vertical: 10px;
`;

const Container = styled.View`
    background-color: ${({theme}) => theme.Colors.background};
    flex: 1;
    align-items: center;
    justify-content: center;
`;

const StyledInput = styled.TextInput`
    width: 80%;
    padding: 10px;
    margin-bottom: 20px;
    border-width: 1px;
    border-color: #ccc;
    border-radius: 5px;
    background-color: ${({ theme }) => theme.Colors.button.background || '#ffffff'};
    color: ${({ theme }) => theme.Colors.text};
`;