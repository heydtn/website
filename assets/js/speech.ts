const synthesis = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance()

window.speechSynthesis.onvoiceschanged = () => {
  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find(v => v.voiceURI == "urn:moz-tts:osx:com.apple.speech.synthesis.voice.Fred") || null;

  if (voice) {
    utterance.lang = "en-US"
    utterance.voice = voice;
  }
}

function say(text: string) {
  synthesis.cancel();
  utterance.text = text;
  synthesis.speak(utterance);
}

export { say }