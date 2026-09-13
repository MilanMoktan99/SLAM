import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider as AppThemeProvider, useThemePreference } from '@/context/ThemeContext';
import { CartProvider } from '@/context/CartContext';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  if (!fontsLoaded) {
    return null; // render nothing until Outfit is ready — swap for a splash screen later if you want
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { scheme } = useThemePreference();
  const { isLoggedIn, profileCompleted, isLoading, profileLoading } = useAuth();

  if (isLoading || (isLoggedIn && profileLoading)) {
    return null; // Firebase is restoring the session and/or profile status — avoid flashing the wrong stack before we know
  }

  const needsProfileSetup = isLoggedIn && !profileCompleted;

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={needsProfileSetup}>
          <Stack.Screen name="(profile-setup)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isLoggedIn && profileCompleted}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]/index" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]/attendees" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="vip-rewards" options={{ headerShown: false }} />
          <Stack.Screen name="chats" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="connections" options={{ headerShown: false }} />
          <Stack.Screen name="my-connections" options={{ headerShown: false }} />
          <Stack.Screen name="group-chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="create-group" options={{ headerShown: false }} />
          <Stack.Screen name="my-groups" options={{ headerShown: false }} />
          <Stack.Screen name="create-event" options={{ headerShown: false }} />
          <Stack.Screen name="create-event-form" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="payment/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="confirmation/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="invoice/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="settings-appearance" options={{ headerShown: false }} />
          <Stack.Screen name="settings-notifications" options={{ headerShown: false }} />
          <Stack.Screen name="settings-language" options={{ headerShown: false }} />
          <Stack.Screen name="settings-account" options={{ headerShown: false }} />
          <Stack.Screen name="settings-account-status" options={{ headerShown: false }} />
          <Stack.Screen name="settings-privacy" options={{ headerShown: false }} />
          <Stack.Screen name="settings-help" options={{ headerShown: false }} />
          <Stack.Screen name="saved" options={{ headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: false }} />
          <Stack.Screen name="vip-checkout" options={{ headerShown: false }} />
          <Stack.Screen name="manage-subscription" options={{ headerShown: false }} />
          <Stack.Screen name="partner/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="list-business" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ headerShown: false }} />
          <Stack.Screen name="shop-checkout" options={{ headerShown: false }} />
          <Stack.Screen name="shop-order/[id]" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}