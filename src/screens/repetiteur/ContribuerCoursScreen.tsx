import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../services/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { extraireTexteCours } from '../../services/iaServiceOpenRouter';

const MATIERES = ['Mathématiques','Physique-Chimie','Français','Anglais','Histoire-Géographie','SVT','Philosophie','Informatique'];
const NIVEAUX = ['6ème','5ème','4ème','3ème','Seconde','1ère','Terminale'];
const TYPES = [{label:'Cours',value:'cours',icon:'book-open-page-variant'},{label:'Devoir',value:'devoir',icon:'clipboard-text-outline'},{label:'Correction',value:'correction',icon:'check-decagram-outline'}];

export default function ContribuerCoursScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [titre,setTitre]=useState(''); const [matiere,setMatiere]=useState(MATIERES[0]); const [niveau,setNiveau]=useState(NIVEAUX[6]);
  const [type,setType]=useState('cours'); const [description,setDescription]=useState(''); const [tags,setTags]=useState(''); const [prix,setPrix]=useState('0');
  const [file,setFile]=useState<any>(null); const [busy,setBusy]=useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (info.exists && 'size' in info && typeof info.size === 'number' && info.size > 20 * 1024 * 1024) {
        Alert.alert('Fichier trop volumineux','La taille maximale est de 20 Mo.'); return;
      }
      setFile({ uri: asset.uri, name: asset.name, size: info.exists && 'size' in info ? Number(info.size || 0) : 0, mime: asset.mimeType || 'application/octet-stream' });
    } catch (e) {
      console.error('Sélection document:', e);
      Alert.alert('Erreur','Impossible de sélectionner le fichier.');
    }
  };

  const submit = async () => {
    if (!userId) return Alert.alert('Erreur','Utilisateur non connecté.');
    if (!titre.trim()) return Alert.alert('Erreur','Le titre est obligatoire.');
    if (!file) return Alert.alert('Erreur','Ajoutez votre document avant de publier.');
    setBusy(true);
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
      const storageRef = ref(storage, `contributions/${userId}/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, blob, { contentType: file.mime });
      const fileUrl = await getDownloadURL(storageRef);

      let contenuTexte = '';
      try {
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' as any });
        contenuTexte = await extraireTexteCours(base64, matiere);
      } catch (e) { console.warn('Extraction IA ignorée:', e); }

      await addDoc(collection(db,'contributions'), {
        titre:titre.trim(), matiere, niveau, type, description:description.trim(), contenuTexte:contenuTexte || null,
        tags:tags.split(',').map(t=>t.trim()).filter(Boolean), prix:Number.parseInt(prix,10)||0,
        fichier:{url:fileUrl,nom:file.name,taille:Math.round(file.size/1024),type:file.mime||''},
        auteur:{userId,nom:userData?.nom||'',prenom:userData?.prenom||'',role:userData?.role||'repetiteur'},
        statut:'en_attente',date_soumission:serverTimestamp(),score_ia:0,telechargements:0,revenus_generes:0,
      });
      Alert.alert('Contribution envoyée','Votre cours a bien été transmis pour validation.',[{text:'OK',onPress:()=>navigation.navigate('MesCours')}]);
    } catch (e) {
      console.error('Soumission contribution:',e);
      Alert.alert('Erreur','Impossible de publier ce document.');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?10:24}>
      <ScrollView style={[styles.container,{backgroundColor:colors.background}]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}>
          <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.iconBtn}><MaterialCommunityIcons name="arrow-left" size={23} color={colors.text}/></TouchableOpacity>
          <View style={{flex:1}}><Text style={[styles.kicker,{color:colors.primary}]}>NOUVELLE CONTRIBUTION</Text><Text style={[styles.title,{color:colors.text}]}>Partager un cours</Text></View>
        </View>

        <View style={[styles.hero,{backgroundColor:colors.primary+'12',borderColor:colors.primary+'25'}]}>
          <View style={[styles.heroIcon,{backgroundColor:colors.primary}]}><MaterialCommunityIcons name="lightbulb-on-outline" size={25} color="white"/></View>
          <View style={{flex:1}}><Text style={[styles.heroTitle,{color:colors.text}]}>Un document utile, simplement.</Text><Text style={[styles.heroText,{color:colors.textMuted}]}>Ajoutez votre ressource et laissez Repetia s'occuper du reste.</Text></View>
        </View>

        <Text style={[styles.label,{color:colors.text}]}>Titre</Text>
        <TextInput value={titre} onChangeText={setTitre} placeholder="Ex. Les dérivées — cours complet" placeholderTextColor={colors.textMuted} style={[styles.input,{backgroundColor:colors.surface,borderColor:colors.border,color:colors.text}]}/>

        <Text style={[styles.label,{color:colors.text}]}>Type</Text>
        <View style={styles.typeRow}>{TYPES.map(t=><TouchableOpacity key={t.value} onPress={()=>setType(t.value)} style={[styles.typeCard,{backgroundColor:type===t.value?colors.primary+'12':colors.surface,borderColor:type===t.value?colors.primary:colors.border}]}><MaterialCommunityIcons name={t.icon as any} size={20} color={type===t.value?colors.primary:colors.textMuted}/><Text style={[styles.typeText,{color:type===t.value?colors.primary:colors.text}]}>{t.label}</Text></TouchableOpacity>)}</View>

        <View style={styles.twoCols}>
          <View style={{flex:1}}><Text style={[styles.label,{color:colors.text}]}>Matière</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chips}>{MATIERES.map(m=><TouchableOpacity key={m} onPress={()=>setMatiere(m)} style={[styles.chip,{backgroundColor:m===matiere?colors.primary:colors.surface,borderColor:m===matiere?colors.primary:colors.border}]}><Text style={{color:m===matiere?'white':colors.text,fontSize:11,fontWeight:'600'}}>{m}</Text></TouchableOpacity>)}</View></ScrollView></View>
        </View>

        <Text style={[styles.label,{color:colors.text}]}>Niveau</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chips}>{NIVEAUX.map(n=><TouchableOpacity key={n} onPress={()=>setNiveau(n)} style={[styles.chip,{backgroundColor:n===niveau?colors.primary:colors.surface,borderColor:n===niveau?colors.primary:colors.border}]}><Text style={{color:n===niveau?'white':colors.text,fontSize:11,fontWeight:'600'}}>{n}</Text></TouchableOpacity>)}</View></ScrollView>

        <Text style={[styles.label,{color:colors.text}]}>Description <Text style={{fontWeight:'400',color:colors.textMuted}}>(facultatif)</Text></Text>
        <TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Ce que l'élève va apprendre..." placeholderTextColor={colors.textMuted} style={[styles.textarea,{backgroundColor:colors.surface,borderColor:colors.border,color:colors.text}]}/>

        <Text style={[styles.label,{color:colors.text}]}>Document</Text>
        <TouchableOpacity onPress={pickDocument} style={[styles.uploadCard,{backgroundColor:colors.surface,borderColor:file?colors.primary:colors.border}]}>
          <View style={[styles.uploadIcon,{backgroundColor:colors.primary+'12'}]}><MaterialCommunityIcons name={file?'file-check-outline':'cloud-upload-outline'} size={28} color={colors.primary}/></View>
          <View style={{flex:1}}><Text style={[styles.uploadTitle,{color:colors.text}]} numberOfLines={1}>{file?file.name:'Choisir un document'}</Text><Text style={[styles.uploadText,{color:colors.textMuted}]}>{file?`${Math.max(1,Math.round(file.size/1024))} Ko · Appuyer pour remplacer`:'PDF, Word, PowerPoint ou autre document · 20 Mo max'}</Text></View><MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted}/>
        </TouchableOpacity>

        <Text style={[styles.label,{color:colors.text}]}>Tags <Text style={{fontWeight:'400',color:colors.textMuted}}>(facultatif)</Text></Text>
        <TextInput value={tags} onChangeText={setTags} placeholder="dérivées, fonctions, bac" placeholderTextColor={colors.textMuted} style={[styles.input,{backgroundColor:colors.surface,borderColor:colors.border,color:colors.text}]}/>
        <Text style={[styles.label,{color:colors.text}]}>Prix (FCFA)</Text>
        <TextInput value={prix} onChangeText={setPrix} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} style={[styles.input,{backgroundColor:colors.surface,borderColor:colors.border,color:colors.text}]}/>

        <TouchableOpacity onPress={submit} disabled={busy} style={[styles.submit,{backgroundColor:colors.primary,opacity:busy?.55:1}]}>{busy?<ActivityIndicator color="white"/>:<><MaterialCommunityIcons name="rocket-launch-outline" size={20} color="white"/><Text style={styles.submitText}>Publier ma contribution</Text></>}</TouchableOpacity>
        <Text style={[styles.footer,{color:colors.textMuted}]}>Votre document sera vérifié avant sa mise en ligne.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles=StyleSheet.create({container:{flex:1},content:{padding:16,paddingBottom:48},topbar:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:18},iconBtn:{width:42,height:42,borderRadius:21,justifyContent:'center',alignItems:'center'},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1.2},title:{fontSize:24,fontWeight:'800',marginTop:2},hero:{flexDirection:'row',alignItems:'center',gap:12,padding:15,borderRadius:18,borderWidth:1,marginBottom:18},heroIcon:{width:48,height:48,borderRadius:16,justifyContent:'center',alignItems:'center'},heroTitle:{fontSize:15,fontWeight:'800'},heroText:{fontSize:12,lineHeight:17,marginTop:3},label:{fontSize:13,fontWeight:'700',marginBottom:7,marginTop:14},input:{minHeight:48,borderWidth:1,borderRadius:13,paddingHorizontal:14,fontSize:14},textarea:{minHeight:100,borderWidth:1,borderRadius:13,padding:14,fontSize:14},typeRow:{flexDirection:'row',gap:8},typeCard:{flex:1,minHeight:74,borderWidth:1,borderRadius:14,justifyContent:'center',alignItems:'center',gap:6},typeText:{fontSize:12,fontWeight:'700'},twoCols:{flexDirection:'row'},chips:{flexDirection:'row',gap:7,paddingBottom:2},chip:{paddingHorizontal:11,paddingVertical:8,borderRadius:20,borderWidth:1},uploadCard:{minHeight:82,borderWidth:1,borderRadius:16,padding:12,flexDirection:'row',alignItems:'center',gap:12},uploadIcon:{width:52,height:52,borderRadius:15,justifyContent:'center',alignItems:'center'},uploadTitle:{fontSize:14,fontWeight:'700'},uploadText:{fontSize:11,marginTop:4,lineHeight:15},submit:{minHeight:52,borderRadius:15,marginTop:24,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},submitText:{color:'white',fontSize:15,fontWeight:'800'},footer:{fontSize:11,textAlign:'center',marginTop:10}}
