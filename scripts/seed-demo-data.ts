import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function createFallbackWave() {
  const outputDir = join(process.cwd(), 'backend', 'public', 'briefings');
  await mkdir(outputDir, { recursive: true });
  const file = join(outputDir, 'fallback-briefing.wav');

  const sampleRate = 8000;
  const durationSeconds = 2;
  const samples = sampleRate * durationSeconds;
  const pcm = Buffer.alloc(samples * 2);

  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * 440 * t) * 0.15;
    pcm.writeInt16LE(Math.round(amplitude * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  await writeFile(file, Buffer.concat([header, pcm]));
}

createFallbackWave().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
