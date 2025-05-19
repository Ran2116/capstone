const ELEVEN_LABS_API_KEY = "sk_a7f539b04a1487841352dc9ba348124ded7eec79bc2d9799";  
const ELEVEN_VOICE_ID = "WsSrHM90iFqenC73SO3M"; 
const ELEVEN_API_URL = "https://api.elevenlabs.io/v1/text-to-speech/";


async function speakWithElevenLabs(text) {
    const url = `${ELEVEN_API_URL}${ELEVEN_VOICE_ID}`;
    
    const requestBody = {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "xi-api-key": ELEVEN_LABS_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error("Error fetching audio from ElevenLabs:", response.statusText);
            return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error("Error communicating with ElevenLabs API:", error);
    }
}