import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import ConnexionEnfantScreen from '../screens/eleve/Auth/ConnexionEnfantScreen';
import InscriptionEnfantScreen from '../screens/eleve/Auth/InscriptionEnfantScreen';
import ParentAuthScreen from '../screens/parent/ParentAuthScreen';

const Stack = createStackNavigator();

function AuthNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold', color: colors.text },
      }}
    >
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ title: 'Choisir votre rôle' }} />
      <Stack.Screen name="ConnexionEnfant" component={ConnexionEnfantScreen} options={{ title: 'Connexion Élève' }} />
      <Stack.Screen name="InscriptionEnfant" component={InscriptionEnfantScreen} options={{ title: 'Inscription Élève' }} />
      <Stack.Screen name="ParentAuthScreen" component={ParentAuthScreen} options={{ title: 'Connexion Parent' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Mot de passe oublié' }} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
