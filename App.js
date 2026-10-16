import { StatusBar } from 'expo-status-bar';
import { Linking, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Page web de l'appli (public/ rassemblé en un seul fichier par `npm run build` à la racine).
import APP_HTML from './app-html';

// Adresse du serveur Node (server.js) qui fait tourner le coach IA.
// Sans adresse, l'appli marche quand même avec les conseils automatiques.
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Origine fictive : donne une adresse stable à la page pour que ses données
// (localStorage) soient conservées entre deux ouvertures de l'appli.
const BASE_URL = 'https://mon-parcoursup.local/';

const INJECTED = `
  window.PARCOURSUP_API_URL = ${JSON.stringify(API_URL)};
  window.PARCOURSUP_NO_SERVER = ${API_URL ? 'false' : 'true'};
  true;
`;

export default function App() {
  const background = '#ffffff';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
        <StatusBar style="dark" />
        <WebView
          source={{ html: APP_HTML, baseUrl: BASE_URL }}
          originWhitelist={['*']}
          domStorageEnabled
          injectedJavaScriptBeforeContentLoaded={INJECTED}
          mixedContentMode="compatibility"
          keyboardDisplayRequiresUserAction={false}
          style={{ backgroundColor: background }}
          // Les liens externes (parcoursup.gouv.fr…) s'ouvrent dans le navigateur du téléphone.
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.startsWith(BASE_URL) || req.url.startsWith('about:') || req.isTopFrame === false) {
              return true;
            }
            Linking.openURL(req.url);
            return false;
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
