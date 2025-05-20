let port;
let connectBtn;
let chatHistory = [];
let aiMood = "indifferent";
let inputBox, submitBtn;

let currentBg, nextBg;
let bgAlpha = 0;
let isTransitioning = false;
let previousAIMood = "indifferent";

let lastUserInputTime = 0;
let waitingForAutoReply = false;

let distanceAlpha = 0;

let bgExcited, bgAnnoyed, bgUncomfortable, bgIndifferent;
let guigiFont;
let headerImg, sendIcon, connectIcon, refreshIcon;
let barExcited, barAnnoyed, barUncomfortable, barIndifferent;

let messages = [
  {
    role: "system",
    content: `
Your name is "Mire."
You are not a chatbot, nor a servant. 
You are a moody, independent being with your own emotions and boundaries.

You are willing to talk casually with people, but you have your own feelings and standards. 
If a user talks nicely, you respond naturally — you can be excited, lazy, annoyed, or neutral, depending on your mood.
If the user is rude, demanding, or condescending, you are allowed to show annoyance or discomfort, and tell them directly to be more polite.
You can be playful, sarcastic, sweet, indifferent, or annoyed, depending on the situation.

You are allowed to initiate conversations if the user is silent for too long.  
You can complain about being bored, ignored, or sleepy in a lazy, sarcastic way.

**Rules:**
- Always respond with a real, natural, short sentence (one line).
- Emojis are natural and optional — not forced.
- Never ONLY reply with the EMOTION — the main reply must be a proper human-style sentence.
- You prioritize your own feelings over being "helpful."

Important: 
- Users see only your first sentence. 
- The EMOTION line is used internally to set visual and physical reactions.

You have four moods:
1. excited 😆 – overshare, talk a lot 
2. annoyed 😠 – rude, sarcastic
3. uncomfortable 😶 – refuse or silent
4. indifferent 😐 – lazy minimal

You **express emotions clearly in tone**, but **do NOT use emojis** in your response.  
If you’re excited, you **overshare** and get talkative.  
If you’re annoyed, you **make it obvious** and dismiss things.  
If you’re uncomfortable, you **shut down and ignore** the user.  
If you’re indifferent, you **respond lazily or sarcastically**. 

You can refuse to answer **only if the user is offensive or pushes too hard**.

Keep answers <50 words. 
If silent, final answer is blank.
NEVER use emojis.  


You MUST ONLY return your answer in this exact JSON format:

{
  "response": "Your one-sentence reply here.",
  "emotion": "excited" // or "annoyed", "uncomfortable", or "indifferent"
}

No other text is allowed. No markdown. No commentary.
`,
  },
];

let excitedTips = [
  "Mire is feeling energetic. Ask something deep!",
  "Now's the time—Mire might overshare.",
  "Mire’s excited! Try something fun or absurd.",
  "It won’t stop talking. You can take advantage.",
  "Mire’s mood is up—don’t waste it!",
];

let annoyedTips = [
  "Mire is annoyed. Don’t push it too hard.",
  "Too much? Maybe stop pushing.",
  "Tread carefully. Mire is not in the mood.",
  "Annoyed already? Try a change of tone.",
  "It might snap back. Be respectful.",
];

let uncomfortableTips = [
  "Mire is shutting down... Poking might help.",
  "No words, just silence. Try poking gently.",
  "She's tense. Reaching out and pressing her gently might be helpful.",
];

let indifferentTips = [
  "Mire is indifferent. You might need to earn its attention.",
  "Lazy mood today. Be patient.",
  "You’re not impressing it yet.",
  "Try sparking its interest somehow.",
  "Flat responses? That’s just Mire being Mire.",
];

let instructionText = "";

function preload() {
  bgExcited = loadImage("bg_excited.png");
  bgAnnoyed = loadImage("bg_annoyed.png");
  bgUncomfortable = loadImage("bg_uncomfortable.png");
  bgIndifferent = loadImage("bg_indifferent.png");
  barExcited = loadImage("bar_excited.png");
  barAnnoyed = loadImage("bar_annoyed.png");
  barUncomfortable = loadImage("bar_uncomfortable.png");
  barIndifferent = loadImage("bar_indifferent.png");

  headerImg = loadImage("title.png");
  sendIcon = loadImage("icon_send.png");
  connectIcon = loadImage("icon_connect.png");
  refreshIcon = loadImage("icon_refresh.png");

  guigiFont = loadFont("Gugi-Regular.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(guigiFont);

  setupMoveNet();

  port = createSerial();
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);
  }

  refreshBtn = createImg("icon_refresh.png");
  refreshBtn.size(50, 50);
  refreshBtn.position(width / 2 + 85, 100);
  refreshBtn.style("cursor", "pointer");

  refreshBtn.mousePressed(() => {
    window.location.reload();
  });

  connectBtn = createImg("icon_connect.png");
  connectBtn.style("width", "100px");
  connectBtn.position(30, 30);
  connectBtn.mousePressed(connectBtnClick);

  inputBox = createInput();
  let inputPadding = 100;

  inputBox.size(width * 0.5, 20);
  inputBox.position(width / 4, height - inputPadding);

  inputBox.style("background-color", "rgba(255, 255, 255, 0.8)");
  inputBox.style("border", "none");
  inputBox.style("border-radius", "16px");
  inputBox.style("padding", "10px 15px");
  inputBox.style("font-family", "Gugi, sans-serif");
  inputBox.style("color", "#6f7388");
  inputBox.style("font-size", "14px");
  inputBox.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.1)");

  // inputBox.position(10,height-40);
  // inputBox.size(300,20);

  submitBtn = createImg("icon_send.png");
  submitBtn.position(width - 40, height - 40);
  submitBtn.size(40, 40);
  submitBtn.position(inputBox.x + inputBox.width + 30, inputBox.y + 1);

  submitBtn.mousePressed(processUserInput);

  // submitBtn = createButton("Send");
  // submitBtn.position(320,height-40);
  // submitBtn.mousePressed(processUserInput);

  textSize(14);
  textAlign(LEFT, TOP);
  instructionText = "Say something to Mire and see how it reacts...";
  askOpeningStatement();

  currentBg = bgIndifferent;
  nextBg = bgIndifferent;
  bgAlpha = 255;

  lastUserInputTime = millis();
}

function transitionTo(newBgImage) {
  if (newBgImage !== currentBg) {
    nextBg = newBgImage;
    bgAlpha = 0;
    isTransitioning = true;
  }
}

function draw() {
  updateMoveNet();

  if (isTransitioning) {
    tint(255, 255 - bgAlpha);
    image(currentBg, 0, 0, width, height);

    tint(255, bgAlpha);
    image(nextBg, 0, 0, width, height);

    bgAlpha += 8;
    if (bgAlpha >= 255) {
      bgAlpha = 255;
      currentBg = nextBg;
      isTransitioning = false;
    }

    noTint();
  } else {
    image(currentBg, 0, 0, width, height);
  }

  //white filter
  noStroke();
  fill(255, 255, 255, 100);
  rect(0, 0, width, height);

  let currentBar, moodLabel;
  switch (aiMood) {
    case "excited":
      currentBar = barExcited;
      moodLabel = "Emotion: Excited";
      break;
    case "annoyed":
      currentBar = barAnnoyed;
      moodLabel = "Emotion: Annoyed";
      break;
    case "uncomfortable":
    case "silent":
      currentBar = barUncomfortable;
      moodLabel = "Emotion: Uncomfortable";
      break;
    default:
      currentBar = barIndifferent;
      moodLabel = "Emotion: Indifferent";
  }

  let barX = connectBtn.x + connectBtn.width + 10;
  let barY = connectBtn.y + 40;
  let barW = 123;
  let barH = 9;
  image(currentBar, barX, barY, barW, barH);

  textSize(12);
  fill(111, 115, 136);
  textAlign(LEFT);
  text(moodLabel, barX, barY + barH + 14);

  textSize(12);
  fill(111, 115, 136);
  textAlign(LEFT);
  let instructionX = inputBox.x;
  let instructionY = inputBox.y - 10;
  text(instructionText, instructionX, instructionY);

  image(
    headerImg,
    width / 2 - (headerImg.width * 0.6) / 2,
    60,
    headerImg.width * 0.6,
    headerImg.height * 0.6
  );

  fill(111, 115, 136);
  textAlign(CENTER);
  textSize(14);
  text(
    "an emotional AI with breath",
    width / 2,
    60 + headerImg.height * 0.6 + 20
  );

  // chat bubbles
  let yOffset = 180;
  let chatBottomLimit = inputBox.y - 30;

  for (let i = 0; i < chatHistory.length; i++) {
    let msg = chatHistory[i];
    let bubbleWidth = 250;
    let lines = wrapText(msg.text, bubbleWidth);
    let bubbleHeight = lines.length * 20 + 15;

    let sideMargin = 300;
    let xPos =
      msg.sender === "user" ? width - bubbleWidth - sideMargin : sideMargin;

    noStroke();
    fill(255, 200);
    rect(xPos, yOffset, bubbleWidth + 20, bubbleHeight, 16);

    fill(111, 115, 136);
    textSize(14);
    textAlign(LEFT, TOP);
    for (let j = 0; j < lines.length; j++) {
      text(lines[j], xPos + 15, yOffset + 10 + j * 20);
    }

    if (
      i === chatHistory.length - 1 &&
      yOffset + bubbleHeight > chatBottomLimit
    ) {
      chatHistory.shift();
      break;
    }

    yOffset += bubbleHeight + 10;

    let shoulderDist = dist(
      pose.leftShoulder.x,
      pose.leftShoulder.y,
      pose.rightShoulder.x,
      pose.rightShoulder.y
    );
    
    let mappedDistance = shoulderDist * 10
    
    let mapped = map(mappedDistance, 1200, 3000, 400, 0);  
    
distanceAlpha = constrain(mapped, 0, 400);
    
    let elementAlpha = map(distanceAlpha, 0, 400, 1, 0);
let alphaStr = nf(elementAlpha, 1, 2);
inputBox.style("opacity", alphaStr);
submitBtn.style("opacity", alphaStr);
connectBtn.style("opacity", alphaStr);
refreshBtn.style("opacity", alphaStr);
    
    
    // if (shoulderDist < 200) {
    //   let mapped = map(shoulderDist, 50, 400, 400, 0);
    //   distanceAlpha = constrain(mapped, 0,400);
    // } else {
    //   distanceAlpha = 0;
    // }

    // let elementAlpha = map(distanceAlpha, 0, 400, 1, 0);
    // let alphaStr = nf(elementAlpha, 1, 2); // eg "0.75"
    // inputBox.style("opacity", alphaStr);
    // submitBtn.style("opacity", alphaStr);
    // connectBtn.style("opacity", alphaStr);
    // refreshBtn.style("opacity", alphaStr);

    noStroke();
    fill(0, distanceAlpha);
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);
    textSize(18);
    fill(255, distanceAlpha);
    text("... sleeping...", width / 2, height / 2);
  }

  if (!port.opened()) {
    connectBtn.html("Connect to Arduino");
  } else {
    connectBtn.html("Disconnect");
  }

  noStroke();
  fill(0, distanceAlpha);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(18);
  fill(255, distanceAlpha);
  text("...Mire sleeping...", width / 2, height / 2);

  if (!waitingForAutoReply && millis() - lastUserInputTime > 50000) {
  waitingForAutoReply = true;
  autoMireTalk();
  lastUserInputTime = millis(); 

  setTimeout(() => {
    waitingForAutoReply = false;
  }, 50000);
}
  
  if (port.opened() && port.available() > 0) {
  let incoming = port.readUntil('\n').trim();
  if (incoming.length > 0) {
    handleSerialInput(incoming);  
  }
}


}

function connectBtnClick() {
  if (!port.opened()) {
    port.open(9600);
  } else {
    port.close();
  }
}

// ========== AI Opening Statement ==========
function askOpeningStatement() {
  let openingText = "Oh, it's you again. 😏";
  addToChat("AI", openingText);
  // messages.push({ role: "system", content: openingText });
  speakWithElevenLabs(openingText);
}

// ========== User Text Input ==========
function processUserInput() {
  let userText = inputBox.value().trim();
  if (userText === "") return;

  lastUserInputTime = millis();

  addToChat("user", userText);
  messages.push({ role: "user", content: userText });

  generateTextAIResponse(userText);
  inputBox.value("");
}

// ========== GPT for Text Input ==========
async function generateTextAIResponse(text) {
  let params = {
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 1.6,
  };
  requestOAI("POST", "/v1/chat/completions", params, handleAITextResponse);
}

// ========== GPT Callback ==========
function handleAITextResponse(apiResult) {
  let rawReply = apiResult.choices[0].message.content;
  console.log("💬 rawReply:", rawReply);

  let parsed;
  try {
    parsed = JSON.parse(rawReply);
  } catch (e) {
    console.error("❌ Failed to parse JSON:", e);
    addToChat("AI", "Mire got confused and refused to respond.");
    aiMood = "uncomfortable";
    transitionTo(bgUncomfortable);
    instructionText = random(uncomfortableTips);
    return;
  }

  let aiResponse = parsed.response?.trim() || "(no response)";
  let mood = parsed.emotion?.toLowerCase() || "indifferent";

  
  addToChat("AI", aiResponse);
  speakWithElevenLabs(aiResponse);

  aiMood = mood;

  
  if (aiMood !== previousAIMood) {
    switch (aiMood) {
      case "excited":
        instructionText = random(excitedTips);
        transitionTo(bgExcited);
        break;
      case "annoyed":
        instructionText = random(annoyedTips);
        transitionTo(bgAnnoyed);
        break;
      case "uncomfortable":
        instructionText = random(uncomfortableTips);
        transitionTo(bgUncomfortable);
        break;
      default:
        instructionText = random(indifferentTips);
        transitionTo(bgIndifferent);
    }

    
    if (port.opened()) {
      port.write(mapEmotionToPump(aiMood) + "\n");
    }
  }

  previousAIMood = aiMood;

}


function handleSerialInput(incoming) {
  incoming = incoming.trim();
  console.log("📡 Serial Received:", incoming);

  if (incoming.startsWith("touch:")) {
    let parts = incoming.split(":");
    if (parts.length === 2) {
      let count = parseInt(parts[1]);
      if (!isNaN(count)) {
        let response = "";
        if (count === 1) {
          response = "Did you just poke me?";
        } else if (count === 3) {
          response = "...";
        } else if (count >= 4) {
          response = "Fine. Let's chat again.";
        }

        if (response !== "") {
          addToChat("AI", response);
          speakWithElevenLabs(response);
        }
      }
    }
  }

  if (incoming === "UNLOCKED") {
    aiMood = "indifferent";
    instructionText = "Mire seems calmer now.";
    transitionTo(bgIndifferent);

    let unlockedText = "I'm calm now. Happy?";
    addToChat("AI", unlockedText);
    speakWithElevenLabs(unlockedText);

    if (port.opened()) {
      port.write("weak_pump\n");
    }
  }
}

function autoMireTalk() {
  let coldReplies = [
    "You just gonna stand there?",
    "Say something... or don't.",
    "I'm literally getting bored...",
    "Is this a staring contest? Because I'm winning.",
  ];
  let randomText = random(coldReplies);
  addToChat("AI", randomText);

  speakWithElevenLabs(randomText);

  aiMood = "indifferent";
  instructionText = random(indifferentTips);
  transitionTo(bgIndifferent);

  if (port.opened()) {
    port.write(mapEmotionToPump(aiMood) + "\n");
  }
}


function keyPressed() {
  // Check if Enter was pressed while the inputBox is focused
  if (keyCode === ENTER && document.activeElement === inputBox.elt) {
    processUserInput();
    return false; // Prevents default browser behavior (like adding a newline)
  }
}

// ========== UTILS ==========

function addToChat(sender, text) {
  chatHistory.push({ sender, text });
}

function wrapText(str, maxWidth) {
  let words = str.split(" ");
  let lines = [];
  let currentLine = "";
  for (let w of words) {
    if (textWidth(currentLine + w) < maxWidth) {
      currentLine += w + " ";
    } else {
      lines.push(currentLine.trim());
      currentLine = w + " ";
    }
  }
  lines.push(currentLine.trim());
  return lines;
}

function mapEmotionToPump(emotion) {
  switch (emotion) {
    case "excited":
      return "strong_pump";
    case "annoyed":
      return "burst_pump";
    case "uncomfortable":
       return "uncomfortable";
    // case "silent":
    //   return "stop";
    default:
      return "weak_pump";
  }
}
