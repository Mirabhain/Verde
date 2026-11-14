
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// Store conversation history
let conversationHistory = [];

// LAYER 1: static registry, shipped with the app
const MALAYSIA_REGIONS = {
  NORTHWEST_RICE: {
    label: "Northwest rice belt",
    states: ["Kedah", "Perlis", "Pulau Pinang", "Perak"],
    mainCrops: ["paddy", "durian", "oilPalm"],
    granaries: ["MADA", "Kerian", "Seberang Perai"],
    soils: ["marine and riverine alluvial clay"],
    climateRisk: ["flooding", "water shortage in dry spells"]
  },
  EAST_COAST: {
    label: "East coast",
    states: ["Kelantan", "Terengganu"],
    mainCrops: ["paddy", "rubber", "oilPalm", "durian", "leafyVegetable"],
    granaries: ["KADA", "KETARA", "Besut", "Kemasin"],
    soils: ["alluvial clay", "sandy beach ridge soils", "Ultisols"],
    climateRisk: ["Northeast monsoon floods", "drought in dry months"]
  },
  WEST_COAST_CENTRAL: {
    label: "West coast central",
    states: ["Selangor", "Negeri Sembilan", "Melaka", "Perak"],
    mainCrops: ["oilPalm", "paddy", "leafyVegetable", "rubber"],
    granaries: ["IADA Barat Laut Selangor", "Krian"],
    soils: ["coastal clay", "acid sulphate soils", "Ultisols"],
    climateRisk: ["lowland flooding", "acid sulphate pH drops"]
  },
  JOHOR_SOUTH: {
    label: "Johor and the south",
    states: ["Johor"],
    mainCrops: ["oilPalm", "pineapple", "durian", "leafyVegetable"],
    soils: ["peat", "Oxisols", "Ultisols"],
    climateRisk: ["Northeast monsoon rainfall", "peat subsidence and fire"]
  },
  PAHANG_INTERIOR: {
    label: "Pahang interior",
    states: ["Pahang"],
    mainCrops: ["durian", "oilPalm", "rubber", "paddy"],
    soils: ["Ultisols", "Oxisols"],
    notes: "Raub is the durian centre. Rompin and Pekan paddy yields are low."
  },
  HIGHLANDS: {
    label: "Cameron Highlands and cool uplands",
    states: ["Pahang (Cameron Highlands)"],
    elevationMinM: 1000,
    mainCrops: ["tomato", "leafyVegetable", "tea", "strawberry"],
    soils: ["steep slope soils"],
    climateRisk: ["heavy rain reducing quality", "pest pressure", "erosion"]
  },
  SARAWAK_LOWLAND: {
    label: "Sarawak lowland and coast",
    states: ["Sarawak"],
    mainCrops: ["oilPalm", "pepper", "pineapple", "paddy"],
    granaries: ["IADA Batang Lupar", "Kalaka Saribas"],
    soils: ["peat", "Ultisols", "alluvial"],
    climateRisk: ["year round heavy rain", "peat drainage issues"]
  },
  SABAH: {
    label: "Sabah",
    states: ["Sabah"],
    mainCrops: ["oilPalm", "paddy"],
    granaries: ["Kota Belud"],
    soils: ["Ultisols", "steep land soils"],
    climateRisk: ["erosion on steep slopes", "Northeast monsoon rainfall"]
  }
};

// LAYER 2: crop catalogue (agronomy notes are general knowledge, validate with MARDI and MPOB)
const CROP_CATALOGUE = {
  oilPalm:  { family: "Arecaceae",   perennial: true,  watch: ["Ganoderma", "potassium and boron deficiency"] },
  rubber:   { family: "Euphorbiaceae", perennial: true, watch: ["leaf fall disease", "tapping panel dryness"] },
  paddy:    { family: "Poaceae",     perennial: false, watch: ["blast", "water management", "weedy rice"] },
  durian:   { family: "Malvaceae",   perennial: true,  watch: ["Phytophthora root rot", "waterlogging"] },
  pineapple:{ family: "Bromeliaceae",perennial: false, watch: ["heart rot", "peat nutrient leaching"] },
  pepper:   { family: "Piperaceae",  perennial: true,  watch: ["foot rot", "stunt disease"] },
  chilli:   { family: "Solanaceae",  perennial: false, watch: ["anthracnose", "bacterial wilt"] },
  tomato:   { family: "Solanaceae",  perennial: false, watch: ["bacterial wilt", "late blight"] },
  leafyVegetable: { family: "mixed", perennial: false, watch: ["flood loss", "pest pressure"] }
};

// LAYER 3: per request context, mostly auto resolved
const farmContext = {
  location: { lat: null, lon: null, state: null, district: null, elevationM: null },
  regionId: null,            // resolved from state, or HIGHLANDS if elevation exceeds 1000 m
  farmScale: "smallholder",  // smallholder | estate | granary scheme
  crop: { id: null, growthStage: null, ageOrDaysAfterPlanting: null, previousFamily: null },
  soil: { type: null, ph: null, organicMatterPct: null, testDate: null },
  water: { source: "rain", irrigation: null, drainage: null },
  priority: null,
  liveData: { source: "NASA POWER, SMAP, GPM", fetchedAt: null,
              rainfall7dMm: null, avgTempC: null, soilMoisturePct: null }
};

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = chatInput.value.trim();

    if (!message) return;

    // Display the farmer's message
    addMessage(message, "user");

    chatInput.value = "";
    chatInput.disabled = true;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                farmContext,
                history: conversationHistory
            })
        });

        const data = await response.json();

        console.log("Server status:", response.status);
        console.log("Server response:", data);

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        // Display AI response
        addMessage(data.reply, "assistant");

        // Save both sides of the conversation
        conversationHistory.push(
            { role: "user", content: message },
            { role: "assistant", content: data.reply }
        );

    } catch (error) {
        console.error("Chat error:", error);
        addMessage(error.message, "assistant");
    } finally {
        chatInput.disabled = false;
        chatInput.focus();
    }
});

function addMessage(message, sender) {
    const messageElement = document.createElement("div");

    messageElement.classList.add("message", sender);

    // textContent prevents AI/user text from being interpreted as HTML
    messageElement.textContent = message;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
