const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require("fs");
const path = require("path");

function streamToFile(readable, outPath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(outPath);
    readable.pipe(fileStream);
    fileStream.on("finish", () => resolve(outPath));
    fileStream.on("error", reject);
  });
}

async function generateVoice(voiceName, text, outPath, prosody = {}) {
  console.log(`Generating ${voiceName}...`);
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, prosody);
  await streamToFile(audioStream, outPath);
  tts.close();
  console.log(`Saved: ${outPath}`);
}

async function main() {
  const text = "Bienvenidos a bordo de la experiencia de Universal Assistance.";
  const publicDir = path.join(__dirname, "public");

  // 1. es-UY-MateoNeural (Uruguay Male - Natural, Warm Rioplatense)
  await generateVoice("es-UY-MateoNeural", text, path.join(publicDir, "voice_es_uy_mateo.mp3"), { rate: "-3%" });

  // 2. es-UY-ValentinaNeural (Uruguay Female - Elegant, Warm Rioplatense)
  await generateVoice("es-UY-ValentinaNeural", text, path.join(publicDir, "voice_es_uy_valentina.mp3"), { rate: "-2%" });

  // 3. es-AR-TomasNeural (Argentina Male - Confident, Warm Rioplatense)
  await generateVoice("es-AR-TomasNeural", text, path.join(publicDir, "voice_es_ar_tomas.mp3"), { rate: "-3%" });

  // 4. es-AR-ElenaNeural (Argentina Female - Professional, Warm Rioplatense)
  await generateVoice("es-AR-ElenaNeural", text, path.join(publicDir, "voice_es_ar_elena.mp3"), { rate: "-2%" });

  console.log("\nAll 4 Rioplatense voiceover candidates generated successfully!");
}

main().catch(err => {
  console.error("Error generating voices:", err);
  process.exit(1);
});
