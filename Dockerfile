# Utiliser une image Node.js optimisée pour la production
FROM node:18-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour éviter de reconstruire toute l'image à chaque changement
COPY package.json package-lock.json ./

# Installer les dépendances en mode production
RUN npm install --only=production

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port utilisé par le service
EXPOSE 4000

# Définir la commande par défaut pour démarrer l'application
CMD ["node", "index.js"]
