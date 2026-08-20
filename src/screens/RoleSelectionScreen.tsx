import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLES = [
  {
    id: 'eleve',
    name: 'Élève',
    description: 'Accédez aux cours, révisions et exercices',
    icon: 'school',
    color: '#4CAF50',
  },
  {
    id: 'parent',
    name: 'Parent',
    description: 'Suivez la progression de votre enfant',
    icon: 'account-group',
    color: '#2196F3',
  },
  {
    id: 'repetiteur',
    name: 'Répétiteur',
    description: 'Partagez vos cours et gagnez de l\'argent',
    icon: 'account-tie',
    color: '#FF9800',
  },
  {
    id: 'etablissement',
    name: 'Établissement',
    description: 'Gérez vos élèves et professeurs',
    icon: 'office-building',
    color: '#9C27B0',
  },
];

const RoleSelectionScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const handleSelectRole = (role: string) => {
    if (role === "eleve") {
      navigation.navigate("ConnexionEnfant");
      return;
    }
    navigation.navigate("Login", { selectedRole: role });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Choisissez votre rôle</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sélectionnez le type de compte que vous souhaitez utiliser
        </Text>
      </View>

      <View style={styles.rolesContainer}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleSelectRole(role.id)}
          >
            <View style={[styles.roleIcon, { backgroundColor: role.color + '20' }]}>
              <MaterialCommunityIcons name={role.icon as any} size={24} color={role.color} />
            </View>
            <Text style={[styles.roleName, { color: colors.text }]}>{role.name}</Text>
            <Text style={[styles.roleDescription, { color: colors.textMuted }]}>
              {role.description}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  rolesContainer: {
    padding: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  roleDescription: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default RoleSelectionScreen;
