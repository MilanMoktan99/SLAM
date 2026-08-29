import { Stack } from 'expo-router';

// initialRouteName is safe to rely on here (unlike the root Stack earlier)
// since there's no root-URL ambiguity for this group — it's only ever
// entered via the profileCompleted guard flipping on in app/_layout.tsx.
export default function ProfileSetupLayout() {
  return (
    <Stack initialRouteName="verify" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verify" />
      <Stack.Screen name="create-profile" />
      <Stack.Screen name="interests" />
    </Stack>
  );
}