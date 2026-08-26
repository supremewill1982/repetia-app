import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ParentTabs from './ParentTabs';
import ParentAuthScreen from '../screens/parent/ParentAuthScreen';
import ParentCoupDePouce from '../screens/parent/ParentCoupDePouce';
import ParentIACoach from '../screens/parent/ParentIACoach';
import ParentLier from '../screens/parent/ParentLier';
import ParentParametres from '../screens/parent/ParentParametres';
import ParentRapport from '../screens/parent/ParentRapport';
import ParentSessionDetail from '../screens/parent/ParentSessionDetail';
import ParentTimeline from '../screens/parent/ParentTimeline';
import TousRepetiteursScreen from '../screens/parent/TousRepetiteursScreen';
import ParentRepetiteurDetailScreen from '../screens/parent/ParentRepetiteurDetail';
import MesReservationsParentScreen from '../screens/parent/MesReservationsParentScreen';
import ParentReservationScreen from '../screens/parent/ParentReservation';
import ParentSuiviDetail from '../screens/parent/ParentSuiviDetail';
import ParentSupport from '../screens/parent/ParentSupport';
import ParentCompteScreen from '../screens/parent/ParentCompteScreen';
const Stack=createStackNavigator();
export default function ParentNavigator(){const{colors}=useTheme();const back=(navigation:any)=><TouchableOpacity onPress={()=>navigation.goBack()} style={{marginLeft:16}}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.text}/></TouchableOpacity>;
return <Stack.Navigator initialRouteName="ParentTabs" screenOptions={{headerStyle:{backgroundColor:colors.surface,elevation:0,shadowOpacity:0},headerTintColor:colors.text,headerTitleStyle:{fontWeight:'bold',color:colors.text}}}>
<Stack.Screen name="ParentTabs" component={ParentTabs} options={{headerShown:false}}/><Stack.Screen name="ParentAuthScreen" component={ParentAuthScreen} options={({navigation})=>({title:'Connexion Parent',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentCoupDePouce" component={ParentCoupDePouce} options={({navigation})=>({title:'Coup de pouce',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentIACoach" component={ParentIACoach} options={({navigation})=>({title:'Coach IA',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentLier" component={ParentLier} options={({navigation})=>({title:'Lier un enfant',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentParametres" component={ParentParametres} options={({navigation})=>({title:'Profil',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentCompte" component={ParentCompteScreen} options={({navigation})=>({title:'Mon compte',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentRapport" component={ParentRapport} options={({navigation})=>({title:'Suivi',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentSuiviDetail" component={ParentSuiviDetail} options={({navigation})=>({title:'Suivi détaillé',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentSupport" component={ParentSupport} options={({navigation})=>({title:'Aide & support',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentSessionDetail" component={ParentSessionDetail} options={({navigation})=>({title:'Détails Session',headerLeft:()=>back(navigation)})}/><Stack.Screen name="TousRepetiteursScreen" component={TousRepetiteursScreen} options={({navigation})=>({title:'Tous les répétiteurs',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentTimeline" component={ParentTimeline} options={({navigation})=>({title:'Timeline',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentRepetiteurDetail" component={ParentRepetiteurDetailScreen} options={({navigation})=>({title:'Profil du répétiteur',headerLeft:()=>back(navigation)})}/><Stack.Screen name="ParentReservation" component={ParentReservationScreen} options={({navigation})=>({title:'Réserver un cours',headerLeft:()=>back(navigation)})}/><Stack.Screen name="MesReservationsParent" component={MesReservationsParentScreen} options={({navigation})=>({title:'Mes réservations',headerLeft:()=>back(navigation)})}/>
</Stack.Navigator>;
}
