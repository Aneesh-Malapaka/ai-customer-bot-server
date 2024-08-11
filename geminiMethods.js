const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();

const categorizeDBGemini = () => {
  const apiKey = process.env.API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: process.env.SYSTEM_PROMPT_DB_FETCH,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ];

  async function run(userQuery) {
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });
    const result = await chatSession.sendMessage(userQuery);
    return result.response.text();
  }

  return run;
};

const responsesGemini = () => {
  const apiKey = process.env.API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: process.env.SYSTEM_PROMPT_USE_DB,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ];

  async function runFinalQuery(queryArray) {
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });
    let prompt = `${queryArray.query} Based on our categories, here are some options: ${queryArray.data}`;
    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  }

  return runFinalQuery;
};

module.exports = { responsesGemini, categorizeDBGemini };
