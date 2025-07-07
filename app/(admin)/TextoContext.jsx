import { createContext, useContext, useState } from "react";
const TextoContext = createContext();
export const TextoProvider=({children})=>{
 const [texto,setTexto]=useState("");
 return(
    <TextoContext.Provider value={{texto,setTexto}}>
        {children}
    </TextoContext.Provider>
 );
};
export const useTexto=()=>useContext(TextoContext);