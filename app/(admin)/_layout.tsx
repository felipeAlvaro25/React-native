import { Stack } from "expo-router";
import { TextoProvider } from "./TextoContext";
export default function Layout(){
    return(
        <TextoProvider>
            <Stack/>
        </TextoProvider>
    )
}