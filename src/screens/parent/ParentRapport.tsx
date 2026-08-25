import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function ParentRapport({ route }: any) {
  const { colors } = useTheme();
  const enfant = route?.params?.enfant;
  const sessions = route?.params?.sessions || [];
  const bienEtre = route?.params?.bienEtre;
  const prediction = route?.params?.prediction;
  const terminees = useMemo(() => sessions.filter((s: any) => s.statut === 'terminee' || s.statut === 'termine'), [sessions]);
  const moyenne = useMemo(() => {
    const notes = sessions.map((s: any) => Number(s.note ?? s.score)).filter((n: number) => Number.isFinite(n) && n > 0);
    return notes.length ? (notes.reduce((a: number, b: number) => a + b, 0) / notes.length).toFixed(1) : '—';
  }, [sessions]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Rapport de suivi</Text><Text style={[styles.subtitle, { color: colors.textMuted }]}>{enfant?.prenom ? `Progression de ${enfant.prenom}` : 'Suivi scolaire de votre enfant'}</Text></View>
      <View style={styles.grid}>
        <Stat icon="school-outline" value={String(terminees.length)} label="Cours terminés" colors={colors} />
        <Stat icon="chart-line" value={moyenne} label="Moyenne récente" colors={colors} />
        <Stat icon="heart-pulse" value={bienEtre ? `${bienEtre.score}/100` : '—'} label="Bien-être" colors={colors} />
        <Stat icon="target" value={prediction ? `${prediction.pourcentage}%` : '—'} label="Objectif Bac" colors={colors} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.text }]}>Lecture rapide</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{terminees.length ? `${terminees.length} cours terminés ont été enregistrés. Consultez régulièrement cette page pour suivre la progression.` : 'Les données de progression apparaîtront après les premières séances.'}</Text>
        {prediction?.label ? <Info icon="target" text={`Pronostic actuel : ${prediction.label}`} colors={colors} /> : null}
        {bienEtre?.niveau ? <Info icon="heart-outline" text={`Bien-être scolaire : ${String(bienEtre.niveau)}`} colors={colors} /> : null}
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.text }]}>Conseil</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>Utilisez les réservations et le profil des répétiteurs pour ajuster l’accompagnement selon les besoins de votre enfant.</Text>
      </View>
    </ScrollView>
  );
}
function Stat({ icon, value, label, colors }: any) { return <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialCommunityIcons name={icon} size={22} color={colors.primary}/><Text style={[styles.statValue,{color:colors.primary}]}>{value}</Text><Text style={[styles.statLabel,{color:colors.textMuted}]}>{label}</Text></View>; }
function Info({ icon, text, colors }: any) { return <View style={styles.info}><MaterialCommunityIcons name={icon} size={19} color={colors.primary}/><Text style={[styles.infoText,{color:colors.text}]}>{text}</Text></View>; }
const styles=StyleSheet.create({container:{flex:1},content:{padding:16,paddingBottom:32,gap:12},header:{paddingVertical:8},title:{fontSize:24,fontWeight:'900'},subtitle:{fontSize:12,marginTop:4},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{width:'48%',borderWidth:1,borderRadius:17,padding:15,gap:6},statValue:{fontSize:23,fontWeight:'900'},statLabel:{fontSize:10},card:{borderWidth:1,borderRadius:18,padding:16},section:{fontSize:16,fontWeight:'900',marginBottom:8},body:{fontSize:13,lineHeight:20},info:{flexDirection:'row',alignItems:'center',gap:9,marginTop:12},infoText:{fontSize:12,fontWeight:'700'}});
