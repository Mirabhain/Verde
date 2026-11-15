
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

let conversationHistory = [];

// Farm context
const farmContext = {
    location: {
        lat: null,
        lon: null,
        state: null,
        district: null,
        elevationM: null
    },

    regionId: null,
    farmScale: "smallholder",

    crop: {
        id: null,
        growthStage: null,
        ageOrDaysAfterPlanting: null,
        previousFamily: null
    },

    soil: {
        type: null,
        ph: null,
        organicMatterPct: null,
        testDate: null
    },

    water: {
        source: "rain",
        irrigation: null,
        drainage: null
    },

    priority: null,

    liveData: {
        source: "NASA POWER, SMAP, GPM",
        fetchedAt: null,
        rainfall7dMm: null,
        avgTempC: null,
        soilMoisturePct: null
    }
};

// Submit chat message
chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = chatInput.value.trim();

    if (!message) return;

    // Display user message
    addMessage(message, "user");

    chatInput.value = "";
    chatInput.disabled = true;

    const sendButton = chatForm.querySelector(
        'button[type="submit"]'
    );

    if (sendButton) sendButton.disabled = true;

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
            throw new Error(
                data.error || "Unable to generate a response."
            );
        }

        // Display assistant response
        addMessage(data.reply, "assistant");

        // Save conversation history
        conversationHistory.push(
            { role: "user", content: message },
            { role: "assistant", content: data.reply }
        );

    } catch (error) {
        console.error("Chat error:", error);

        addMessage(
            error.message || "Something went wrong.",
            "assistant"
        );

    } finally {
        chatInput.disabled = false;

        if (sendButton) sendButton.disabled = false;

        chatInput.focus();
    }
});

// Display chat messages
function addMessage(message, sender) {
    const messageElement = document.createElement("div");

    messageElement.classList.add("message", sender);

    // Prevent HTML injection
    messageElement.textContent = message;

    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}
