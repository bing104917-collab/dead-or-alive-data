from pathlib import Path
import re
p = Path('app/monologue/index.tsx')
text = p.read_text(encoding='latin-1')
pattern = r"import \{ StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Platform \} from 'react-native';\s*import DebugView from '@/components/DebugView';"
repl = "import { StyleSheet, TouchableOpacity, SafeAreaView, View as RNView, TextInput, ScrollView, Alert, Platform } from 'react-native';"
text = re.sub(pattern, repl, text, count=1)
text = text.replace('<DebugView', '<RNView').replace('</DebugView>', '</RNView>')
p.write_text(text, encoding='utf-8')
print('reverted DebugView usage')
