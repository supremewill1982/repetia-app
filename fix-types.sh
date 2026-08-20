#!/data/data/com.termux/files/usr/bin/bash

set -e

echo "🔧 Correction automatique TypeScript RÉPÉTIA..."

# --------------------------------------------------
# 1. Correction constante DELAI_RECLAMATION
# --------------------------------------------------

sed -i 's/DEL AI_RECLAMATION/DELAI_RECLAMATION/g' \
  src/types/certificationTypes.ts

# --------------------------------------------------
# 2. Expo FileSystem : utiliser l'API legacy
# --------------------------------------------------

for file in src/services/*.ts src/services/*.tsx; do
    [ -f "$file" ] || continue

    if grep -q "FileSystem\.documentDirectory\|FileSystem\.cacheDirectory\|FileSystem\.EncodingType\|FileSystem\.writeAsStringAsync" "$file"; then
        sed -i "s/from 'expo-file-system'/from 'expo-file-system\\/legacy'/g" "$file"
    fi
done

# --------------------------------------------------
# 3. Corrections Firebase Storage évidentes
# --------------------------------------------------

if [ -f src/services/imageStorageService.ts ]; then

    if ! grep -q "from 'firebase/storage'" src/services/imageStorageService.ts; then

        sed -i "1i import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';" \
            src/services/imageStorageService.ts

    fi
fi

# --------------------------------------------------
# 4. Afficher les fichiers concernés
# --------------------------------------------------

echo ""
echo "📋 Fichiers contenant encore des 'any' explicites :"

grep -Rnw "any" src \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    | head -50 || true

echo ""
echo "✅ Corrections mécaniques terminées."
echo ""
echo "👉 Lance maintenant :"
echo "   npx tsc --noEmit"
