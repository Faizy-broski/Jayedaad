import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuyerSearchScreen } from '../screens/BuyerSearchScreen';
import { AgentCRMScreen } from '../screens/AgentCRMScreen';

export type RootStackParamList = {
  BuyerSearch: undefined;
  AgentCRM: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Mirrors the same screen concepts as apps/web's route groups
// ((buyer)/search, (agent)/crm) — both consume the same packages/core
// viewmodels, which is what proves the Clean Architecture code-sharing claim.
export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="BuyerSearch">
      <Stack.Screen name="BuyerSearch" component={BuyerSearchScreen} options={{ title: 'Search Properties' }} />
      <Stack.Screen name="AgentCRM" component={AgentCRMScreen} options={{ title: 'Inquiry Inbox' }} />
    </Stack.Navigator>
  );
}
