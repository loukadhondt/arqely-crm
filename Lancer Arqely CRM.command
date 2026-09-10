#!/bin/bash
# Double-cliquez sur ce fichier pour lancer Arqely CRM en local.
cd "$(dirname "$0")/app" || exit 1
export PATH="$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v npm >/dev/null; then echo "Node.js est requis : https://nodejs.org"; read -p "Appuyez sur Entrée..."; exit 1; fi
[ -f .env ] || cp .env.example .env
[ -d node_modules ] || npm install
( sleep 3; open "http://localhost:5173" ) &
echo "Arqely CRM tourne sur http://localhost:5173 — fermez cette fenêtre pour l'arrêter."
npm run dev -- --port 5173
