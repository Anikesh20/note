import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from "expo-router";
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from "../hooks/useAuth";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <StripeProvider publishableKey="pk_test_51RiI3tE9QfjmYq5YNm3ieCK0tEerDQnaljFiRrPp0EYxNvFuSgVjVRS24tsflGMVbjtDgrS83LmVI5GC67vikfWj0026lkRD7V">
          <Stack screenOptions={{ headerShown: false }} />
        </StripeProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
