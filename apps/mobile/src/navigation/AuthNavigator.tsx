import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';
import { BecomeAnAgentScreen } from '../screens/auth/BecomeAnAgentScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { TermsScreen } from '../screens/auth/TermsScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { otpSendFailed?: boolean } | undefined;
  BecomeAnAgent: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
  Terms: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator({ initialRouteName = 'Login' }: { initialRouteName?: keyof AuthStackParamList }) {
  return (
    <AuthStack.Navigator initialRouteName={initialRouteName}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
      <AuthStack.Screen
        name="BecomeAnAgent"
        component={BecomeAnAgentScreen}
        options={{ title: 'Become an Agent', headerBackVisible: false }}
      />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms and Conditions' }} />
    </AuthStack.Navigator>
  );
}
