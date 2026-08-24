import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import ParentDashboard from '../screens/parent/ParentDashboard';
import ParentRapport from '../screens/parent/ParentRapport';
import TousRepetiteursScreen from '../screens/parent/TousRepetiteursScreen';
import MesReservationsParentScreen from '../screens/parent/MesReservationsParentScreen';
import ParentParametres from '../screens/parent/ParentParametres';

const Tab=createBottomTabNavigator();
export default function ParentTabs(){const{colors}=useTheme();const insets=useSafeAreaInsets();const bottom=Math.max(insets.bottom,6);return <Tab.Navigator initialRouteName="Accueil" screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.textMuted,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,borderTopWidth:1,height:56+bottom,paddingBottom:bottom,paddingTop:5},tabBarLabelStyle:{fontSize:10,fontWeight:'700'},tabBarIcon:({color,size})=><MaterialCommunityIcons name=(({Accueil:'home',Suivi:'chart-line','Répétiteurs':'account-school','Réservations':'calendar-check',Profil:'account-circle'}) as any)[route.name]||'circle'} size={size} color={color}/>})}>
<Tab.Screen name="Accueil" component={ParentDashboard}/><Tab.Screen name="Suivi" component={ParentRapport}/><Tab.Screen name="Répétiteurs" component={TousRepetiteursScreen}/><Tab.Screen name="Réservations" component={MesReservationsParentScreen}/><Tab.Screen name="Profil" component={ParentParametres}/>
</Tab.Navigator>}
