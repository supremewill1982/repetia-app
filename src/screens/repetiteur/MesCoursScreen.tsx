import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';

export default function MesCoursScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [cours, setCours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const charger = useCallback(async () => { if (!userId) return; setLoading(true); try { const snap = await getDocs(query(collection(db,'contributions'),where('auteur.userId','==',userId))); setCours(snap.docs.map(d=>({id:d.id,...d.data()}))); } catch(e) { console.error(e); Alert.alert('Erreur','Impossible de charger vos contributions.'); } finally { setLoading(false); } },[userId]);
  useFocusEffect(useCallback(()=>{ charger(); },[charger]));
  const ouvrirContribuer=()=>navigation.navigate('Contribuer');
  const ouvrirDetails=(id:string)=>navigation.navigate('Profil',{screen:'ContributionDetails',params:{contributionId:id}});
  const ouvrirEdition=(id:string)=>navigation.navigate('Profil',{screen:'EditContribution',params:{contributionId:id}});
  const supprimer=(id:string)=>Alert.alert('Supprimer','Supprimer définitivement cette contribution?',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async()=>{try{await deleteDoc(doc(db,'contributions',id));setCours(p=>p.filter(c=>c.id!==id));}catch(e){console.error(e);Alert.alert('Erreur','Impossible de supprimer la contribution.');}}}]);
  const couleur=(s:string)=>s==='validé'?colors.success:s==='rejeté'?colors.error:colors.warning;
  if(loading)return <View style={[styles.center,{backgroundColor:colors.background}]}><ActivityIndicator size="large" color={colors.primary}/></View>;
  return <ScrollView style={[styles.container,{backgroundColor:colors.background}]} contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={[styles.title,{color:colors.text}]}>Mes cours</Text><Text style={[styles.sub,{color:colors.textMuted}]}>{cours.length} contribution(s)</Text></View><TouchableOpacity onPress={ouvrirContribuer} style={[styles.add,{backgroundColor:colors.primary}]}><MaterialCommunityIcons name="plus" size={23} color="white"/></TouchableOpacity></View>
    {cours.length===0?<View style={[styles.empty,{backgroundColor:colors.surface,borderColor:colors.border}]}><MaterialCommunityIcons name="file-plus-outline" size={48} color={colors.primary}/><Text style={[styles.emptyTitle,{color:colors.text}]}>Aucun cours publié</Text><Text style={[styles.emptyText,{color:colors.textMuted}]}>Partagez votre première ressource pédagogique.</Text><TouchableOpacity onPress={ouvrirContribuer} style={[styles.primaryBtn,{backgroundColor:colors.primary}]}><Text style={styles.primaryText}>Contribuer un cours</Text></TouchableOpacity></View>:cours.map(item=><View key={item.id} style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
      <TouchableOpacity onPress={()=>ouvrirDetails(item.id)} activeOpacity={0.8}><View style={styles.row}><View style={[styles.icon,{backgroundColor:colors.primary+'15'}]}><MaterialCommunityIcons name="file-document-outline" size={25} color={colors.primary}/></View><View style={{flex:1}}><Text style={[styles.courseTitle,{color:colors.text}]} numberOfLines={2}>{item.titre||'Sans titre'}</Text><Text style={[styles.meta,{color:colors.textMuted}]}>{item.matiere||'—'} · {item.niveau||'—'}</Text></View><View style={[styles.badge,{backgroundColor:couleur(item.statut)+'18'}]}><Text style={{fontSize:10,fontWeight:'800',color:couleur(item.statut)}}>{String(item.statut||'en_attente').replace('_',' ')}</Text></View></View></TouchableOpacity>
      <View style={[styles.stats,{borderTopColor:colors.border}]}><Text style={[styles.stat,{color:colors.textMuted}]}>{item.telechargements||0} téléchargement(s)</Text><Text style={[styles.stat,{color:colors.textMuted}]}>{Number(item.revenus_generes||0).toLocaleString()} FCFA</Text></View>
      <View style={styles.actions}><TouchableOpacity onPress={()=>ouvrirEdition(item.id)} style={[styles.action,{backgroundColor:colors.primary+'12'}]}><MaterialCommunityIcons name="pencil" size={16} color={colors.primary}/><Text style={{color:colors.primary,fontWeight:'700'}}>Modifier</Text></TouchableOpacity><TouchableOpacity onPress={()=>supprimer(item.id)} style={[styles.action,{backgroundColor:colors.error+'12'}]}><MaterialCommunityIcons name="delete-outline" size={16} color={colors.error}/><Text style={{color:colors.error,fontWeight:'700'}}>Supprimer</Text></TouchableOpacity></View>
    </View>)}
  </ScrollView>;
}
const styles=StyleSheet.create({container:{flex:1},content:{padding:16,paddingBottom:40},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},title:{fontSize:25,fontWeight:'900'},sub:{fontSize:12,marginTop:2},add:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},empty:{padding:24,borderRadius:18,borderWidth:1,alignItems:'center',marginTop:40},emptyTitle:{fontSize:18,fontWeight:'800',marginTop:12},emptyText:{fontSize:13,textAlign:'center',marginTop:6},primaryBtn:{marginTop:18,paddingHorizontal:18,paddingVertical:12,borderRadius:12},primaryText:{color:'white',fontWeight:'800'},card:{borderWidth:1,borderRadius:17,padding:14,marginBottom:12},row:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},courseTitle:{fontSize:15,fontWeight:'800'},meta:{fontSize:11,marginTop:3},badge:{paddingHorizontal:8,paddingVertical:5,borderRadius:9},stats:{flexDirection:'row',gap:20,borderTopWidth:1,marginTop:12,paddingTop:10},stat:{fontSize:11},actions:{flexDirection:'row',justifyContent:'flex-end',gap:8,marginTop:12},action:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:8,borderRadius:10},center:{flex:1,alignItems:'center',justifyContent:'center'}});
