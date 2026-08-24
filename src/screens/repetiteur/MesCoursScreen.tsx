import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const goToStack = (navigation: any, screen: string, params?: any) => navigation.navigate('Profil', { screen, params });

export default function MesCoursScreen({ navigation }: any) {
  const { colors } = useTheme(); const { userId } = useAuth();
  const [cours,setCours]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{fetchCours();},[userId]);
  const fetchCours=async()=>{try{setLoading(true);if(!userId)return;const snap=await getDocs(query(collection(db,'contributions'),where('auteur.userId','==',userId)));setCours(snap.docs.map(d=>({id:d.id,...d.data()})));}catch(e){console.error(e);Alert.alert('Erreur','Impossible de charger vos cours');}finally{setLoading(false);}};
  const handleDelete=(id:string)=>Alert.alert('Supprimer le cours','Êtes-vous sûr de vouloir supprimer ce cours ?',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async()=>{try{await deleteDoc(doc(db,'contributions',id));setCours(prev=>prev.filter(c=>c.id!==id));}catch(e){Alert.alert('Erreur','Impossible de supprimer le cours');}}}]);
  const statutColor=(s:string)=>({en_attente:colors.warning,en_modération:colors.info,validé:colors.success,rejeté:colors.error,modification_demandée:colors.warning}[s]||colors.textMuted);
  if(loading)return <View style={[styles.center,{backgroundColor:colors.background}]}><ActivityIndicator size="large" color={colors.primary}/></View>;
  return <ScrollView style={[styles.container,{backgroundColor:colors.background}]} contentContainerStyle={{paddingBottom:90}}>
    <View style={[styles.header,{backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
      <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.text}/></TouchableOpacity>
      <Text style={[styles.headerTitle,{color:colors.text}]}>Mes Contributions</Text>
      <TouchableOpacity style={[styles.add,{backgroundColor:colors.primary}]} onPress={()=>goToStack(navigation,'ContribuerCours')}><MaterialCommunityIcons name="plus" size={23} color="white"/></TouchableOpacity>
    </View>
    {cours.length===0?<View style={styles.empty}><MaterialCommunityIcons name="file-document-outline" size={56} color={colors.textMuted}/><Text style={[styles.emptyTitle,{color:colors.text}]}>Aucune contribution</Text><Text style={[styles.emptyText,{color:colors.textMuted}]}>Partagez votre premier cours avec les élèves.</Text><TouchableOpacity style={[styles.primaryBtn,{backgroundColor:colors.primary}]} onPress={()=>goToStack(navigation,'ContribuerCours')}><Text style={styles.white}>Ajouter un cours</Text></TouchableOpacity></View>:
    cours.map(item=><View key={item.id} style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
      <TouchableOpacity onPress={()=>goToStack(navigation,'ContributionDetails',{contributionId:item.id})} style={styles.row}>
        <View style={{flex:1}}><Text style={[styles.courseTitle,{color:colors.text}]} numberOfLines={2}>{item.titre}</Text><Text style={[styles.meta,{color:colors.textMuted}]}>{item.matiere} · {item.niveau}</Text></View>
        <View style={[styles.badge,{backgroundColor:statutColor(item.statut)+'20'}]}><Text style={{color:statutColor(item.statut),fontSize:11,fontWeight:'700'}}>{String(item.statut||'').replace('_',' ')}</Text></View>
      </TouchableOpacity>
      <View style={styles.stats}><Text style={[styles.stat,{color:colors.textMuted}]}>↓ {item.telechargements||0}</Text><Text style={[styles.stat,{color:colors.textMuted}]}>★ {item.notes_moyenne||0}/5</Text><Text style={[styles.stat,{color:colors.textMuted}]}>{(item.revenus_generes||0).toLocaleString()} FCFA</Text></View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action,{backgroundColor:colors.info+'15'}]} onPress={()=>goToStack(navigation,'EditContribution',{contributionId:item.id})}><MaterialCommunityIcons name="pencil-outline" size={17} color={colors.info}/><Text style={{color:colors.info,fontWeight:'700'}}>Modifier</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.action,{backgroundColor:colors.error+'15'}]} onPress={()=>handleDelete(item.id)}><MaterialCommunityIcons name="delete-outline" size={17} color={colors.error}/><Text style={{color:colors.error,fontWeight:'700'}}>Supprimer</Text></TouchableOpacity>
      </View>
    </View>)}
  </ScrollView>;
}

const styles=StyleSheet.create({container:{flex:1},center:{flex:1,justifyContent:'center',alignItems:'center'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:12,borderBottomWidth:1},back:{width:40,height:40,justifyContent:'center',alignItems:'center'},headerTitle:{fontSize:18,fontWeight:'800'},add:{width:40,height:40,borderRadius:20,justifyContent:'center',alignItems:'center'},empty:{alignItems:'center',padding:40,marginTop:50},emptyTitle:{fontSize:19,fontWeight:'800',marginTop:15},emptyText:{fontSize:13,textAlign:'center',marginTop:6},primaryBtn:{marginTop:18,paddingHorizontal:18,paddingVertical:12,borderRadius:12},white:{color:'white',fontWeight:'800'},card:{margin:12,padding:14,borderRadius:16,borderWidth:1},row:{flexDirection:'row',gap:10},courseTitle:{fontSize:16,fontWeight:'800'},meta:{fontSize:12,marginTop:4},badge:{paddingHorizontal:8,paddingVertical:5,borderRadius:10},stats:{flexDirection:'row',justifyContent:'space-between',marginTop:14,paddingTop:10,borderTopWidth:1,borderTopColor:'#00000010'},stat:{fontSize:11},actions:{flexDirection:'row',justifyContent:'flex-end',gap:8,marginTop:12},action:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:11,paddingVertical:9,borderRadius:10}}
