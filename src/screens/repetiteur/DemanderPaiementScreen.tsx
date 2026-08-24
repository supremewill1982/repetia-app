import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

const METHODES = [
  { value: 'moov_money', label: 'Moov Money', icon: 'cellphone' as const },
  { value: 'airtel_money', label: 'Airtel Money', icon: 'cellphone-wireless' as const },
];

export default function DemanderPaiementScreen() {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [solde, setSolde] = useState(0);
  const [historique, setHistorique] = useState<any[]>([]);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState('moov_money');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const charger = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const tuteurSnap = await getDoc(doc(db, 'tuteurs', userId));
      const userSnap = await getDoc(doc(db, 'users', userId));
      const tuteurData = tuteurSnap.exists() ? tuteurSnap.data() : {};
      const userDataFirestore = userSnap.exists() ? userSnap.data() : {};
      setSolde(Number(tuteurData.solde ?? userDataFirestore.solde ?? 0));
      const snap = await getDocs(query(collection(db, 'demandes_paiement'), where('repetiteur_id', '==', userId)));
      setHistorique(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Erreur chargement données paiement:', error);
      Alert.alert('Paiement','Impossible de charger vos données de paiement. Vérifiez votre connexion puis réessayez.');
    } finally { setLoading(false); }
  }, [userId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const demander = async () => {
    const montantNum = Number.parseInt(montant.replace(/\D/g,''),10);
    const phone = numero.replace(/[\s-]/g,'');
    if (!Number.isFinite(montantNum) || montantNum < 5000) return Alert.alert('Erreur','Le retrait minimum est de 5 000 FCFA.');
    if (montantNum > solde) return Alert.alert('Erreur',`Votre solde disponible est de ${solde.toLocaleString('fr-FR')} FCFA.`);
    if (!/^\+?\d{8,15}$/.test(phone)) return Alert.alert('Erreur','Entrez un numéro de téléphone valide.');
    if (historique.some(x => x.statut === 'en_attente')) return Alert.alert('Demande en cours','Vous avez déjà une demande de paiement en attente.');
    try {
      setSubmitting(true);
      await addDoc(collection(db,'demandes_paiement'),{ repetiteur_id:userId, repetiteur_nom:`${userData?.prenom||''} ${userData?.nom||''}`.trim(), montant:montantNum, methode, numero:phone, statut:'en_attente', date:serverTimestamp() });
      setMontant(''); setNumero(''); await charger(); Alert.alert('Demande envoyée','Votre demande sera traitée manuellement.');
    } catch (error) { console.error(error); Alert.alert('Erreur','Impossible de soumettre votre demande de paiement.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <View style={[styles.center,{backgroundColor:colors.background}]}><ActivityIndicator size="large" color={colors.primary}/></View>;
  return <KeyboardAvoidingView style={[styles.container,{backgroundColor:colors.background}]} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?12:72}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View><Text style={[styles.title,{color:colors.text}]}>Paiement</Text><Text style={[styles.subtitle,{color:colors.textMuted}]}>Retirez vos revenus simplement</Text></View></View>
      <View style={[styles.balance,{backgroundColor:colors.primary}]}><Text style={styles.balanceLabel}>Solde disponible</Text><Text style={styles.balanceValue}>{solde.toLocaleString('fr-FR')} FCFA</Text><Text style={styles.balanceHint}>Retrait minimum : 5 000 FCFA</Text></View>
      <View style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
        <Text style={[styles.cardTitle,{color:colors.text}]}>Demander un retrait</Text>
        <Text style={[styles.label,{color:colors.text}]}>Montant</Text><TextInput value={montant} onChangeText={setMontant} placeholder="Ex. 25 000" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={[styles.input,{backgroundColor:colors.background,borderColor:colors.border,color:colors.text}]}/>
        <Text style={[styles.label,{color:colors.text}]}>Méthode de paiement</Text>
        {METHODES.map(item=>{const active=methode===item.value;return <TouchableOpacity key={item.value} onPress={()=>setMethode(item.value)} style={[styles.method,{backgroundColor:active?colors.primary+'14':colors.background,borderColor:active?colors.primary:colors.border}]}><MaterialCommunityIcons name={item.icon} size={22} color={active?colors.primary:colors.textMuted}/><Text style={[styles.methodText,{color:active?colors.primary:colors.text}]}>{item.label}</Text>{active&&<MaterialCommunityIcons name="check-circle" size={18} color={colors.primary}/>}</TouchableOpacity>})}
        <Text style={[styles.label,{color:colors.text}]}>Numéro de téléphone</Text><TextInput value={numero} onChangeText={setNumero} placeholder="Ex. 07 00 00 00 00" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" returnKeyType="done" style={[styles.input,{backgroundColor:colors.background,borderColor:colors.border,color:colors.text}]}/>
        <TouchableOpacity onPress={demander} disabled={submitting} style={[styles.submit,{backgroundColor:colors.primary,opacity:submitting?.55:1}]}>{submitting?<ActivityIndicator color="white"/>:<><MaterialCommunityIcons name="cash-fast" size={20} color="white"/><Text style={styles.submitText}>Demander le paiement</Text></>}</TouchableOpacity>
      </View>
      {historique.length>0&&<View style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.cardTitle,{color:colors.text}]}>Historique</Text>{historique.map(item=><View key={item.id} style={styles.history}><View style={{flex:1}}><Text style={[styles.amount,{color:colors.text}]}>{Number(item.montant||0).toLocaleString('fr-FR')} FCFA</Text><Text style={[styles.meta,{color:colors.textMuted}]}>{item.methode==='moov_money'?'Moov Money':'Airtel Money'} · {item.numero||''}</Text></View><Text style={{color:item.statut==='payé'?colors.success:colors.warning,fontWeight:'800',fontSize:11}}>{String(item.statut||'').replace('_',' ')}</Text></View>)}</View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({container:{flex:1},content:{padding:16,paddingBottom:40},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{marginBottom:16},title:{fontSize:25,fontWeight:'900'},subtitle:{fontSize:12,marginTop:2},balance:{borderRadius:20,padding:22,marginBottom:14},balanceLabel:{color:'rgba(255,255,255,.82)',fontSize:13},balanceValue:{color:'white',fontSize:29,fontWeight:'900',marginTop:6},balanceHint:{color:'rgba(255,255,255,.82)',fontSize:11,marginTop:7},card:{borderWidth:1,borderRadius:18,padding:16,marginBottom:14},cardTitle:{fontSize:17,fontWeight:'800',marginBottom:12},label:{fontSize:13,fontWeight:'700',marginTop:8,marginBottom:7},input:{minHeight:48,borderWidth:1,borderRadius:12,paddingHorizontal:13,fontSize:16,marginBottom:9},method:{minHeight:52,borderWidth:1,borderRadius:12,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:10,marginBottom:8},methodText:{flex:1,fontSize:14,fontWeight:'700'},submit:{minHeight:50,borderRadius:14,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginTop:12},submitText:{color:'white',fontSize:15,fontWeight:'800'},history:{flexDirection:'row',alignItems:'center',paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#00000010'},amount:{fontSize:14,fontWeight:'800'},meta:{fontSize:11,marginTop:3}});
