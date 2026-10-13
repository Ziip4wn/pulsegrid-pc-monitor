# PulseGrid

PulseGrid est un dashboard local de monitoring PC en temps réel. Un agent **Java 17** collecte les informations matérielles avec OSHI, une API **Node.js** les valide et les diffuse par WebSocket, puis un dashboard **React** les présente.

## Fonctionnalités

- CPU : charge, fréquence, cœurs, température et load average ;
- RAM et swap ;
- volumes, espace libre et taux d'occupation ;
- trafic réseau, interfaces et adresses IPv4 ;
- principaux processus avec recherche et tri CPU/RAM ;
- graphiques en direct et historique glissant ;
- plusieurs PC, détection en ligne/hors ligne et interface responsive ;
- clé d'ingestion facultative pour un usage sur le réseau local ;
- mode démo sans agent Java.

## Démarrage rapide

Prérequis : **Node.js 20+**, **Java 17+** et `curl` (Linux/macOS). Maven est téléchargé automatiquement par le wrapper au premier lancement.

```bash
npm install
npm run dev
```

Sous Windows, `npm install`

Dans un second terminal :

```bash
npm run agent:run
```

Ouvrez <http://localhost:5173>. Pour voir l'interface avec des mesures simulées, une seule commande suffit :

```bash
npm run demo
```

## Production locale

```bash
npm run build
npm start
```

Le serveur Node sert alors l'API et le dashboard compilé sur <http://localhost:4000>. Lancez l'agent avec `npm run agent:run` dans un autre terminal.

## Configuration

Copiez `.env.example` vers `.env` pour configurer le serveur. Les variables suivantes sont disponibles :

| Variable | Service | Valeur par défaut | Rôle |
| --- | --- | --- | --- |
| `PORT` | Node | `4000` | Port de l'API |
| `MONITOR_TOKEN` | Node + Java | vide | Jeton Bearer partagé |
| `HISTORY_LIMIT` | Node | `900` | Mesures conservées par PC |
| `AGENT_OFFLINE_MS` | Node | `15000` | Délai avant l'état hors ligne |
| `CORS_ORIGIN` | Node | `http://localhost:5173` | Origines web autorisées, séparées par des virgules |
| `PULSEGRID_SERVER_URL` | Java | `http://localhost:4000` | Adresse du serveur Node |
| `AGENT_ID` | Java | nom d'hôte | Identifiant stable de la machine |
| `AGENT_NAME` | Java | nom d'hôte | Nom affiché dans le dashboard |
| `SAMPLE_INTERVAL_MS` | Java | `2000` | Intervalle de collecte (minimum 500 ms) |
| `TOP_PROCESSES` | Java | `10` | Nombre de processus envoyés |

Exemple PowerShell pour un agent sur un autre PC du réseau :

```powershell
$env:PULSEGRID_SERVER_URL="http://192.168.1.10:4000"
$env:MONITOR_TOKEN="une-cle-longue-et-aleatoire"
$env:AGENT_NAME="PC Gaming"
npm run agent:run
```

Le port 4000 doit être autorisé dans le pare-feu du PC serveur. Utilisez un jeton dès que l'API n'est plus limitée à `localhost`.

## Architecture

```text
agent-java (OSHI)  -- HTTP JSON -->  server Node/Express
                                              |
                                              +-- historique en mémoire
                                              +-- Socket.IO --> dashboard React
```

L'historique est volontairement conservé en mémoire pour ce MVP : il est effacé au redémarrage du serveur. Les routes principales sont :

- `POST /api/v1/metrics` : ingestion par les agents ;
- `GET /api/v1/agents` : liste et dernière mesure ;
- `GET /api/v1/agents/:id/history` : historique d'une machine ;
- `GET /api/health` : santé de l'API.

## Vérification

```bash
npm test
npm run build
./mvnw -f agent-java/pom.xml package
```

Le JAR autonome est produit dans `agent-java/target/pulsegrid-agent.jar`.

