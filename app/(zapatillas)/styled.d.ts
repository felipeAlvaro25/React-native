// styled.d.ts
import 'styled-components/native';

declare module 'styled-components/native' {
  export interface DefaultTheme {
    Colors: {
      background: string;
      text: string;
      button: {
        background: string;
        text: string;
      };
      // Otras propiedades que necesites
    };
  }
}
export default {};