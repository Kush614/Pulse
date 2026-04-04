import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_700Bold,
  useFonts as useInstrumentSans,
} from '@expo-google-fonts/instrument-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
  useFonts as useJetBrainsMono,
} from '@expo-google-fonts/jetbrains-mono';

export function usePulseFonts() {
  const [instrumentLoaded] = useInstrumentSans({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_700Bold,
  });
  const [monoLoaded] = useJetBrainsMono({
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  return [instrumentLoaded && monoLoaded] as const;
}
