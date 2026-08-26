import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getEnfantsLies, getSessionsEnfant, calculerScoreBienEtre } from '../../services/parentService';

export default function ParentRapport({ navigation, route }: any) {
  const { colors } = useTheme();
  const [enfants, setEnfants] = useState<any[]>([]); const [enfant, setEnfant] = useState<any>(route?.params?.enfant || null);
  const [sessions, setSessions] = useState<any[]>(route?.params?.sessions || []); const [bienEtre, setBienEtre] = useState<any>(route?.params?.bienEtre || null); const [loading, setLoading] = useState(true);
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const liste = await getEnfantsLies(); setEnfants(liste);
      const actif = enfant ? liste.find(e => e.uid === enfant.uid) || enfant : liste[0] || null;
      setEnfant(actif);
      if (actif) { const data = await getSessionsEnfant(actif.uid); setSessions(data); setBienEtre(calculerScoreBienEtre(data)); }
      else { setSessions([]); setBienEtre(null); }
    } catch (error) { console.error('[ParentRapport] chargement:', error); }
    finally { setLoading(false); }
  }, [enfant]);
  useFocusEffect(useCallback(() => { charger(); }, [charger]));
  const terminees = useMemo(() => sessions.filter(s => ['terminee','termine','confirmee'].includes(String(s.statut || '')) || s.score != null || s.scoreTotal != null), [sessions]);
  const notes = useMemo(() => sessions.map(s => Number(s.note ?? s.score ?? (s.scoreTotal && s.scoreMax ? (s.scoreTotal / s.scoreMax) * 20 : NaN))).filter(n => Number.isFinite(n) && n > 0), [sessions]);
  const moyenne = notes.length ? (notes.reduce((a,b)=>a+b,0)/notes.length).toFixed(1) : '—';
  const progression = notes.length ? Math.round((Number(moyenne) / 20) * 100) : 0;
  if (loading) return <View style={[styles.loading,{backgroundColor:colors.background}]}><ActivityIndicator color={colors.primary} size="large"/></View>;
  return <ScrollView style={[styles.container,{backgroundColor:colors.background}]} contentContainerStyle={styles.content}>
    <View><Text style={[styles.title,{color:colors.text}]}>Rapport de suivi</Text><Text style={[styles.subtitle,{color:colors.textMuted}]}>{enfant?.prenom ? `Progression de ${enfant.prenom}` : 'Suivi scolaire de votre enfant'}</Text></View>
    {enfants.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.children}>{enfants.map(e=><TouchableOpacity key={e.uid} onPress={()=>{setEnfant(e);}} style={[styles.chip,{backgroundColor:e.uid===enfant?.uid?colors.primary:colors.surface,borderColor:e.uid===enfant?.uid?colors.primary:colors.border}]}><Text style={{color:e.uid===enfant?.uid?'#fff':colors.text,fontWeight:'800'}}>{e.prenom}</Text></TouchableOpacity>)}</ScrollView>}
    <View style={styles.grid}><Stat icon="school-outline" value={String(terminees.length)} label="Activités terminées" colors={colors}/><Stat icon="chart-line" value={moyenne} label="Moyenne récente" colors={colors}/><Stat icon="heart-pulse" value={bienEtre ? `${bienEtre.score}/100` : '—'} label="Bien-être scolaire" colors={colors}/><Stat icon="trending-up" value={`${progression}%`} label="Progression" colors={colors}/></View>
    <View style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.section,{color:colors.text}]}>Lecture rapide</Text><Text style={[styles.body,{color:colors.textSecondary}]}>{terminees.length ? `${terminees.length} activités récentes sont disponibles. La moyenne observée est ${moyenne}/20.` : 'Les données de progression apparaîtront après les premières séances.'}</Text>{bienEtre?.niveau&&<Info icon="heart-outline" text={`Bien-être scolaire : ${String(bienEtre.niveau)}`} colors={colors}/>}</View>
    <View style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.section,{color:colors.text}]}>À suivre</Text><Info icon="target" text={notes.length ? 'Comparer les matières et la régularité pour identifier le prochain levier de progression.' : 'Commencer une première activité pour établir une base de comparaison.'} colors={colors}/></View>
    <TouchableOpacity style={[styles.detailButton,{backgroundColor:colors.primary}]} onPress={()=>navigation.navigate('ParentSuiviDetail',{enfantId:enfant?.uid,enfant})}><MaterialCommunityIcons name="chart-box-outline" size={22} color="#fff"/><Text style={styles.detailText}>Voir le suivi détaillé</Text><MaterialCommunityIcons name="chevron-right" size={22} color="#fff"/></TouchableOpacity>
  </ScrollView>;
}
function Stat({icon,value,label,colors}:any){return <View style={[styles.stat,{backgroundColor:colors.surface,borderColor:colors.border}]}><MaterialCommunityIcons name={icon} size={22} color={colors.primary}/><Text style={[styles.statValue,{color:colors.primary}]}>{value}</Text><Text style={[styles.statLabel,{color:colors.textMuted}]}>{label}</Text></View>}
function Info({icon,text,colors}:any){return <View style={styles.info}><MaterialCommunityIcons name={icon} size={19} color={colors.primary}/><Text style={[styles.infoText,{color:colors.text}]}>{text}</Text></View>}
const styles=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center'},container:{flex:1},content:{padding:16,paddingBottom:34,gap:12},title:{fontSize:24,fontWeight:'900'},subtitle:{fontSize:12,marginTop:4},children:{gap:8,paddingVertical:4},chip:{borderWidth:1,borderRadius:18,paddingHorizontal:14,paddingVertical:9},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{width:'48%',borderWidth:1,borderRadius:17,padding:15,gap:6},statValue:{fontSize:23,fontWeight:'900'},statLabel:{fontSize:10},card:{borderWidth:1,borderRadius:18,padding:16},section:{fontSize:16,fontWeight:'900',marginBottom:8},body:{fontSize:13,lineHeight:20},info:{flexDirection:'row',alignItems:'center',gap:9,marginTop:12},infoText:{fontSize:12,fontWeight:'700',flex:1,lineHeight:18},detailButton:{minHeight:54,borderRadius:17,flexDirection:'row',alignItems:'center',paddingHorizontal:16,gap:10},detailText:{color:'#fff',fontSize:14,fontWeight:'900',flex:1}});
