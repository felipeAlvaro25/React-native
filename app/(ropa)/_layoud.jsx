import { Stack } from "expo-router";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {Drawer} from "expo-router/drawer";

export default function layout(){
    return(
        <GestureHandlerRootView style={{flex:1}}>
            <Drawer>
                <Stack screenOptions={{headerShown:false}}>
                <Stack.Screen name="index"/>
                <Stack.Screen name="conversor"/>
                </Stack>
            </Drawer>
        </GestureHandlerRootView>
    )
}