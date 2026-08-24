import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal, Image
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { uploadProfileImage, pickImage } from '../../services/imageStorageService';
import { getAverageRatingForRepetiteur, Rating } from '../../services/ratingService';

const MATIERES = ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Philosophie', 'Informatique'];
const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];

const ProfilRepetiteurScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId, userData, logout } = useAuth();
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    matieres: [] as string[],
    niveau: '',
    bio: '',
    experience: '',
    tarif: '',
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          telephone: data.telephone || '',
          matieres: data.matieres || [],
          niveau: data.niveau || '',
          bio: data.bio || '',
          experience: data.experience || '',
          tarif: data.tarif ? data.tarif.toString() : '',
        });
        setProfileImage(data.profileImage || null);

        // Charger la note moyenne depuis Firebase
        const avgRating = await getAverageRatingForRepetiteur(userId);
        setAverageRating(avgRating);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      Alert.alert('Erreur', 'Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      setUploadingImage(true);
      const imageUri = await pickImage();
      if (!imageUri) return;

      if (!userId) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      const downloadURL = await uploadProfileImage(userId, imageUri);
      setProfileImage(downloadURL);
      Alert.alert('Succès', 'Votre photo de profil a été mise à jour');
    } catch (error) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', 'Impossible de télécharger l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddMatiere = () => {
    if (selectedMatiere && !profile.matieres.includes(selectedMatiere)) {
      setProfile({...profile, matieres: [...profile.matieres, selectedMatiere]});
      setSelectedMatiere('');
    }
  };

  const handleRemoveMatiere = (matiere: string) => {
    setProfile({
      ...profile,
      matieres: profile.matieres.filter(m => m !== matiere)
    });
  };

  const handleSave = async () => {
    if (!profile.nom.trim() || !profile.prenom.trim() || !profile.email.trim()) {
      Alert.alert('Erreur', 'Les champs nom, prénom et email sont obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      if (!userId) return;

      await updateDoc(doc(db, 'users', userId), {
        nom: profile.nom.trim(),
        prenom: profile.prenom.trim(),
        telephone: profile.telephone.trim(),
        matieres: profile.matieres,
        niveau: profile.niveau,
        bio: profile.bio.trim(),
        experience: profile.experience.trim(),
        tarif: profile.tarif ? parseInt(profile.tarif) : 0,
      });

      // Update user profile in auth context if needed
      // await updateUserProfile({
      //   nom: profile.nom.trim(),
      //   prenom: profile.prenom.trim(),
      // });

      Alert.alert('Succès', 'Votre profil a été mis à jour');
      setEditing(false);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre profil');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mon Profil Répétiteur</Text>
        <TouchableOpacity onPress={logout}>
          <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={handleImageUpload} disabled={uploadingImage}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <MaterialCommunityIcons name="account" size={48} color={colors.primary} />
            )}
            {uploadingImage && (
              <View style={styles.imageUploadOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <MaterialCommunityIcons name="camera" size={24} color="white" style={styles.cameraIcon} />
            </View>
          </View>
        </TouchableOpacity>
        {editing ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={[styles.editNameInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={profile.nom}
              onChangeText={(text) => setProfile({...profile, nom: text})}
              placeholder="Nom"
            />
            <TextInput
              style={[styles.editNameInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={profile.prenom}
              onChangeText={(text) => setProfile({...profile, prenom: text})}
              placeholder="Prénom"
            />
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile.nom} {profile.prenom}
            </Text>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {averageRating.toFixed(1)} ({profile.matieres.length} matières)
              </Text>
            </View>
            <Text style={[styles.email, { color: colors.textMuted }]}>
              {profile.email}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations personnelles</Text>

        {editing ? (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={profile.telephone}
              onChangeText={(text) => setProfile({...profile, telephone: text})}
              placeholder="Votre numéro de téléphone"
              keyboardType="phone-pad"
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Niveau maximum</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={profile.niveau}
                onValueChange={(itemValue) => setProfile({...profile, niveau: itemValue})}
                style={{ color: colors.text }}
              >
                <Picker.Item label="Sélectionnez un niveau" value="" />
                {NIVEAUX.map((n) => (
                  <Picker.Item key={n} label={n} value={n} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Matières</Text>
            <View style={styles.matieresContainer}>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]}>
                <Picker
                  selectedValue={selectedMatiere}
                  onValueChange={(itemValue) => setSelectedMatiere(itemValue)}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label="Ajouter une matière" value="" />
                  {MATIERES.map((m) => (
                    <Picker.Item key={m} label={m} value={m} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddMatiere}
                disabled={!selectedMatiere}
              >
                <MaterialCommunityIcons name="plus" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {profile.matieres.length > 0 && (
              <View style={styles.selectedMatieresContainer}>
                {profile.matieres.map((matiere) => (
                  <View key={matiere} style={[styles.selectedMatiere, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.selectedMatiereText, { color: colors.primary }]}>{matiere}</Text>
                    <TouchableOpacity onPress={() => handleRemoveMatiere(matiere)}>
                      <MaterialCommunityIcons name="close" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Bio</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={profile.bio}
              onChangeText={(text) => setProfile({...profile, bio: text})}
              placeholder="Décrivez-vous brièvement..."
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Expérience</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={profile.experience}
              onChangeText={(text) => setProfile({...profile, experience: text})}
              placeholder="Votre expérience en tant que répétiteur..."
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Tarif horaire (FCFA)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={profile.tarif}
              onChangeText={(text) => setProfile({...profile, tarif: text})}
              placeholder="Ex: 5000"
              keyboardType="numeric"
            />
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{profile.telephone || 'Non spécifié'}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="school" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{profile.niveau || 'Non spécifié'}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="book-open" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Matières: {profile.matieres.join(', ') || 'Aucune'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="currency-usd" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Tarif: {profile.tarif ? parseInt(profile.tarif).toLocaleString() : 'Non spécifié'} FCFA/heure
              </Text>
            </View>

            {profile.bio && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>Bio: {profile.bio}</Text>
              </View>
            )}

            {profile.experience && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="briefcase" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>Expérience: {profile.experience}</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.buttonContainer}>
          {editing ? (
            <>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.textMuted + '20' }]}
                onPress={() => {
                  setEditing(false);
                  fetchProfile();
                }}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary, opacity: submitting ? 0.5 : 1 }]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => setEditing(true)}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="white" />
              <Text style={styles.buttonText}>Modifier le profil</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="file-document" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cours publiés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + '10' }]}>
            <MaterialCommunityIcons name="download" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Téléchargements</Text>
          </View>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.info + '10' }]}
            onPress={() => navigation.navigate('RatingsList')}
          >
            <MaterialCommunityIcons name="star" size={24} color={colors.info} />
            <Text style={[styles.statValue, { color: colors.text }]}>{averageRating.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Note moyenne</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, { backgroundColor: colors.warning + '10' }]}>
            <MaterialCommunityIcons name="currency-usd" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>0 FCFA</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Revenus</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imageUploadOverlay: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cameraIcon: {
    marginRight: 1,
    marginBottom: 1,
  },
  nameContainer: {
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    marginTop: 8,
  },
  editNameContainer: {
    width: '100%',
  },
  editNameInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 8,
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  matieresContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedMatieresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedMatiere: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedMatiereText: {
    marginRight: 4,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ProfilRepetiteurScreen;
