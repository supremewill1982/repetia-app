import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { utiliserAgent } from '../../services/agents/agentManager';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const RAPPORT_TYPES = [
  { value: 'performance', label: 'Performance des élèves' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'contributions', label: 'Contributions' },
  { value: 'finances', label: 'Finances' },
  { value: 'certifications', label: 'Certifications' },
];

const PERIODES = [
  { value: 'semaine', label: 'Cette semaine' },
  { value: 'mois', label: 'Ce mois' },
  { value: 'trimestre', label: 'Ce trimestre' },
  { value: 'annee', label: 'Cette année' },
];

const RapportsIAScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [rapports, setRapports] = useState<any[]>([]);
  const [selectedRapport, setSelectedRapport] = useState<any>(null);
  const [analyseIA, setAnalyseIA] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [filterType, setFilterType] = useState<string>('tous');
  const [filterPeriode, setFilterPeriode] = useState<string>('mois');

  useEffect(() => {
    generateMockRapports();
  }, []);

  const generateMockRapports = () => {
    try {
      setLoading(true);

      const mockRapports = [
        {
          id: '1',
          type: 'performance',
          titre: 'Performance moyenne des élèves',
          valeur: '85%',
          description: 'La performance moyenne des élèves est de 85% cette semaine',
          date: new Date(),
          details: {
            matieres: [
              { nom: 'Mathématiques', score: 92, eleves: 45 },
              { nom: 'Physique-Chimie', score: 88, eleves: 38 },
              { nom: 'Français', score: 78, eleves: 42 },
              { nom: 'Anglais', score: 85, eleves: 35 },
            ],
            recommandations: [
              'Organiser des séances de soutien en Français',
              'Féliciter les élèves en Mathématiques',
              'Encourager la participation en Physique-Chimie'
            ]
          }
        },
        {
          id: '2',
          type: 'engagement',
          titre: 'Taux d\'engagement',
          valeur: '72%',
          description: '72% des élèves ont utilisé la plateforme cette semaine',
          date: new Date(Date.now() - 86400000),
          details: {
            jours: [
              { jour: 'Lundi', utilisation: 85 },
              { jour: 'Mardi', utilisation: 78 },
              { jour: 'Mercredi', utilisation: 65 },
              { jour: 'Jeudi', utilisation: 72 },
              { jour: 'Vendredi', utilisation: 88 },
              { jour: 'Samedi', utilisation: 60 },
              { jour: 'Dimanche', utilisation: 45 },
            ],
            recommandations: [
              'Encourager l\'utilisation le week-end',
              'Identifier les élèves peu actifs'
            ]
          }
        },
        {
          id: '3',
          type: 'contributions',
          titre: 'Nouveaux cours ajoutés',
          valeur: '15',
          description: '15 nouveaux cours ont été ajoutés ce mois-ci',
          date: new Date(Date.now() - 172800000),
          details: {
            parMatiere: [
              { matiere: 'Mathématiques', count: 5 },
              { matiere: 'Physique-Chimie', count: 3 },
              { matiere: 'Français', count: 4 },
              { matiere: 'Anglais', count: 2 },
              { matiere: 'Histoire', count: 1 },
            ],
            recommandations: [
              'Encourager les contributions en Histoire',
              'Organiser une formation pour les nouveaux contributeurs'
            ]
          }
        },
        {
          id: '4',
          type: 'finances',
          titre: 'Revenus mensuels',
          valeur: '500 000 FCFA',
          description: 'Revenus totaux pour ce mois: 500 000 FCFA',
          date: new Date(Date.now() - 2592000000),
          details: {
            sources: [
              { source: 'Abonnements', montant: 300000 },
              { source: 'Contributions', montant: 150000 },
              { source: 'Certifications', montant: 50000 },
            ],
            recommandations: [
              'Augmenter les abonnements premium',
              'Promouvoir les certifications'
            ]
          }
        },
        {
          id: '5',
          type: 'certifications',
          titre: 'Nouveaux certifiés',
          valeur: '8',
          description: '8 nouveaux répétiteurs certifiés ce mois',
          date: new Date(Date.now() - 3456000000),
          details: {
            parNiveau: [
              { niveau: 'Bronze', count: 3 },
              { niveau: 'Argent', count: 3 },
              { niveau: 'Or', count: 2 },
            ],
            recommandations: [
              'Organiser des ateliers pour atteindre le niveau Or',
              'Créer un programme de mentorat'
            ]
          }
        },
      ];

      setRapports(mockRapports);
    } catch (error) {
      console.error('Erreur génération rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyserAvecIA = async (rapport: any) => {
    setSelectedRapport(rapport);
    setAnalyzing(true);
    setAnalyseIA('');

    try {
      const prompt = `Analyse ce rapport pour un établissement scolaire et propose des recommandations détaillées:
      \n${JSON.stringify(rapport, null, 2)}
      \nFournis une analyse structurée avec:
      1. Points forts
      2. Points faibles
      3. Recommandations prioritaires
      4. Actions concrètes à mettre en place`;

      const analyse = await utiliserAgent(
        'coach',
        prompt,
        {
          userId: 'etablissement',
          userRole: 'etablissement',
          matiere: '',
          niveau: '',
          historique: []
        }
      );

      setAnalyseIA(analyse);
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      setAnalyseIA('Impossible de générer une analyse. Veuillez réessayer.');
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredRapports = rapports.filter(r =>
    filterType === 'tous' || r.type === filterType
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rapports IA</Text>
        <View />
      </View>

      <View style={[styles.filters, { backgroundColor: colors.surface }]}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Type:</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={filterType}
              onValueChange={(itemValue) => setFilterType(itemValue)}
              style={{ color: colors.text, width: 180 }}
            >
              <Picker.Item label="Tous les types" value="tous" />
              {RAPPORT_TYPES.map((t) => (
                <Picker.Item key={t.value} label={t.label} selectedValue={t.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Période:</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={filterPeriode}
              onValueChange={(itemValue) => setFilterPeriode(itemValue)}
              style={{ color: colors.text, width: 150 }}
            >
              {PERIODES.map((p) => (
                <Picker.Item key={p.value} label={p.label} selectedValue={p.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Génération des rapports...</Text>
          </View>
        ) : filteredRapports.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="chart-line" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucun rapport disponible
            </Text>
          </View>
        ) : (
          filteredRapports.map((rapport) => {
            const iconMap: Record<string, string> = {
              performance: 'trophy',
              engagement: 'heart',
              contributions: 'file-document-multiple',
              finances: 'currency-usd',
              certifications: 'certificate',
            };

            return (
              <View key={rapport.id} style={[styles.rapportCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}>
                <View style={styles.rapportHeader}>
                  <View style={[styles.rapportIcon, { backgroundColor: colors.primary + '20' }]}>
                    <MaterialCommunityIcons
                      name={iconMap[rapport.type] as any || 'chart-line'}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.rapportInfo}>
                    <Text style={[styles.rapportTitre, { color: colors.text }]}>{rapport.titre}</Text>
                    <Text style={[styles.rapportDescription, { color: colors.textMuted }]}>
                      {rapport.description}
                    </Text>
                    <Text style={[styles.rapportDate, { color: colors.textMuted }]}>
                      {rapport.date.toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
                <View style={styles.rapportActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
                    onPress={() => navigation.navigate('RapportDetails', { rapport })}
                  >
                    <MaterialCommunityIcons name="eye" size={18} color={colors.info} />
                    <Text style={[styles.actionButtonText, { color: colors.info }]}>Voir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleAnalyserAvecIA(rapport)}
                  >
                    <MaterialCommunityIcons name="robot" size={18} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Analyse IA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {selectedRapport && (
        <View style={[styles.analyseContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.analyseHeader}>
            <Text style={[styles.analyseTitre, { color: colors.text }]}>
              Analyse IA: {selectedRapport.titre}
            </Text>
            <TouchableOpacity onPress={() => setSelectedRapport(null)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {analyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: colors.textMuted }]}>
                L'IA analyse votre rapport...
              </Text>
            </View>
          ) : analyseIA ? (
            <ScrollView style={styles.analyseContent}>
              <Text style={[styles.analyseText, { color: colors.text }]}>
                {analyseIA}
              </Text>
            </ScrollView>
          ) : (
            <Text style={[styles.emptyAnalyseText, { color: colors.textMuted }]}>
              Appuyez sur "Analyse IA" pour obtenir une analyse détaillée
            </Text>
          )}
        </View>
      )}
    </View>
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderBottomWidth: 1,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    margin: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  rapportCard: {
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
  },
  rapportHeader: {
    flexDirection: 'row',
  },
  rapportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rapportInfo: {
    flex: 1,
  },
  rapportTitre: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rapportDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  rapportDate: {
    fontSize: 12,
    marginTop: 4,
  },
  rapportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  analyseContainer: {
    borderTopWidth: 1,
    padding: 16,
  },
  analyseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyseTitre: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyseContent: {
    maxHeight: 200,
  },
  analyseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  analyzingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyAnalyseText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    padding: 16,
  },
});

export default RapportsIAScreen;
