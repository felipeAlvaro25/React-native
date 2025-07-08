import { Stack } from "expo-router";
  export default function layout(){
    return(
      <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="(zapatillas)"/>
        <Stack.Screen name="(ropa)"/>
        <Stack.Screen name="(admin)"/>
        <Stack.Screen name="(reloj)"/>
      </Stack>
    )
  }