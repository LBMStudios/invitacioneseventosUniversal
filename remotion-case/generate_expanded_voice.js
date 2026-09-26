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

async function generate(voiceName, text, outFilename) {
  console.log(`Generating ${voiceName}...`);
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const outPath = path.join(__dirname, "public", outFilename);
  const { audioStream } = tts.toStream(text, { rate: "-3%" });
  await streamToFile(audioStream, outPath);
  tts.close();
  console.log(`Saved: ${outPath}`);
}

async function main() {
  // Speech text: Aviation Captain Announcement welcoming passengers to the Universal Assistance experience at Movie
  const speechText = "Señores pasajeros, bienvenidos a bordo. Les habla su comandante. Es un verdadero placer darles la bienvenida a la experiencia de Universal Asístans en Movie Montevideo Shopping. Tu viaje es tu viaje, nosotros lo protegemos. Prepárense para disfrutar de la función.";

  await generate("es-AR-TomasNeural", speechText, "voice_expanded_tomas.mp3");
  await generate("es-UY-MateoNeural", speechText, "voice_expanded_mateo.mp3");
  await generate("es-UY-ValentinaNeural", speechText, "voice_expanded_valentina.mp3");

  console.log("All expanded voice candidates generated successfully!");
}

main().catch(console.error);
