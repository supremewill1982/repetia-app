import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ContributionDetailsScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { contributionId } = route.params;
  const [contribution, setContribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchContribution();
  }, [contributionId]);

  const fetchContribution = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'contributions', contributionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContribution({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Erreur chargement contribution:', error);
      Alert.alert('Erreur', 'Impossible de charger la contribution');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Supprimer la contribution',
      'Êtes-vous sûr de vouloir supprimer cette contribution ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteDoc(doc(db, 'contributions', contributionId));
              navigation.goBack();
              Alert.alert('Succès', 'Contribution supprimée avec succès');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la contribution');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleRetirer = async () => {
    Alert.alert(
      'Retirer la contribution',
      'Êtes-vous sûr de vouloir retirer cette contribution de la plateforme ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'contributions', contributionId), {
                statut: 'retire',
                date_retrait: new Date(),
              });
              setContribution({...contribution, statut: 'retire'});
              Alert.alert('Succès', 'Contribution retirée avec succès');
            } catch (error) {
              console.error('Erreur retrait:', error);
              Alert.alert('Erreur', 'Impossible de retirer la contribution');
            }
          }
        }
      ]
    );
  };

  const handleRepublier = async () => {
    try {
      await updateDoc(doc(db, 'contributions', contributionId), {
        statut: 'en_modération',
        date_republication: new Date(),
      });
      setContribution({...contribution, statut: 'en_modération'});
      Alert.alert('Succès', 'Contribution resoumise à la modération');
    } catch (error) {
      console.error('Erreur republication:', error);
      Alert.alert('Erreur', 'Impossible de republier la contribution');
    }
  };

  const getStatutColor = (statut: string) => {
    const colorsMap: Record<string, string> = {
      en_attente: colors.warning,
      en_modération: colors.info,
      validé: colors.success,
      rejeté: colors.error,
      retire: colors.textMuted,
      modification_demandée: colors.warning,
    };
    return colorsMap[statut] || colors.textMuted;
  };

  const getStatutActions = (statut: string) => {
    switch (statut) {
      case 'validé':
        return [
          { label: 'Retirer', action: handleRetirer, color: colors.error, icon: 'delete' },
          { label: 'Modifier', action: () => navigation.navigate('EditContribution', { contributionId }), color: colors.info, icon: 'pencil' },
        ];
      case 'en_attente':
      case 'en_modération':
      case 'modification_demandée':
        return [
          { label: 'Modifier', action: () => navigation.navigate('EditContribution', { contributionId }), color: colors.info, icon: 'pencil' },
        ];
      case 'rejeté':
        return [
          { label: 'Modifier', action: () => navigation.navigate('EditContribution', { contributionId }), color: colors.info, icon: 'pencil' },
          { label: 'Republier', action: handleRepublier, color: colors.success, icon: 'publish' },
        ];
      case 'retire':
        return [
          { label: 'Republier', action: handleRepublier, color: colors.success, icon: 'publish' },
          { label: 'Supprimer', action: handleDelete, color: colors.error, icon: 'delete' },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!contribution) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Contribution introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Détails de la contribution</Text>
        <View />
      </View>

      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>{contribution.titre}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="book-open" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {contribution.matiere} - {contribution.niveau}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="account" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Auteur: {contribution.auteur?.prenom} {contribution.auteur?.nom}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Soumis le: {contribution.date_soumission?.toDate().toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        <View style={[styles.statutContainer, { backgroundColor: getStatutColor(contribution.statut) + '10' }]}>
          <MaterialCommunityIcons name="information" size={16} color={getStatutColor(contribution.statut)} />
          <Text style={[styles.statutText, { color: getStatutColor(contribution.statut) }]}>
            Statut: {contribution.statut.replace('_', ' ')}
          </Text>
        </View>

        {contribution.date_modification && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="update" size={16} color={colors.info} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Modifié le: {contribution.date_modification?.toDate().toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
        <Text style={[styles.description, { color: colors.text }]}>
          {contribution.description || 'Aucune description fournie'}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Fichier</Text>
        {contribution.fichier && (
          <View style={[styles.fileInfo, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-document" size={20} color={colors.primary} />
            <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
              {contribution.fichier.nom}
            </Text>
            <Text style={[styles.fileMeta, { color: colors.textMuted }]}>
              {contribution.fichier.taille} Ko - {contribution.fichier.type.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(contribution.fichier.url)}>
              <MaterialCommunityIcons name="download" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Informations complémentaires</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="tag" size={16} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Tags:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {contribution.tags?.join(', ') || 'Aucun'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="currency-usd" size={16} color={colors.success} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Prix:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {contribution.prix.toLocaleString()} FCFA
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="download" size={16} color={colors.info} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Téléchargements:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {contribution.telechargements || 0}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Note moyenne:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {(contribution.notes_moyenne || 0).toFixed(1)}/5
            </Text>
          </View>
        </View>

        {contribution.revenus_generes && (
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cash" size={16} color={colors.success} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Revenus générés:</Text>
            <Text style={[styles.infoValue, { color: colors.success, fontWeight: 'bold' }]}>
              {contribution.revenus_generes.toLocaleString()} FCFA
            </Text>
          </View>
        )}

        {contribution.commentaire_modération && (
          <View style={[styles.commentaireContainer, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
            <Text style={[styles.commentaireTitle, { color: colors.warning }]}>
              Commentaire de modération:
            </Text>
            <Text style={[styles.commentaireText, { color: colors.text }]}>
              {contribution.commentaire_modération}
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {getStatutActions(contribution.statut).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color + '20' }]}
              onPress={action.action}
            >
              <MaterialCommunityIcons name={action.icon} size={16} color={action.color} />
              <Text style={[styles.actionButtonText, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}

          {contribution.statut !== 'retire' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <>
                  <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>
                    Supprimer
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metaContainer: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    marginLeft: 8,
    fontSize: 14,
  },
  statutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statutText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  fileMeta: {
    marginRight: 8,
    fontSize: 12,
    color: '#666',
  },
  infoGrid: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    marginLeft: 8,
    fontSize: 14,
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
  },
  commentaireContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  commentaireTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentaireText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default ContributionDetailsScreen;
