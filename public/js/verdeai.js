(() => {
    // CONFIG: adjust to match your chatController route and response shape
    const CHAT_ENDPOINT = "/api/chat";
    const NOTES_KEY = "verdeNotes";
    const HISTORY_LIMIT = 10;

    const messagesEl = document.getElementById("chatMessages");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");

    const history = []; // { role: "user" | "assistant", content: string }
    let busy = false;

    marked.setOptions({ gfm: true, breaks: true });

    /* Rendering */

    function renderMarkdown(text) {
        const raw = marked.parse(text || "");
        const clean = DOMPurify.sanitize(raw);
        // Wrap tables so they can scroll sideways inside the bubble
        return clean
            .replace(/<table>/g, '<div class="table-wrap"><table>')
            .replace(/<\/table>/g, "</table></div>");
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addUserMessage(text) {
        const wrap = document.createElement("div");
        wrap.className = "message user";
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = text; // never innerHTML for user text
        wrap.appendChild(bubble);
        messagesEl.appendChild(wrap);
        scrollToBottom();
    }

    function addTyping() {
        const wrap = document.createElement("div");
        wrap.className = "message assistant";
        wrap.innerHTML =
            '<div class="bubble"><div class="typing" aria-label="VerdeAI is typing"><span></span><span></span><span></span></div></div>';
        messagesEl.appendChild(wrap);
        scrollToBottom();
        return wrap;
    }

    function fillAssistant(wrap, markdown) {
        wrap.innerHTML = "";

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        const body = document.createElement("div");
        body.className = "md";
        body.innerHTML = renderMarkdown(markdown);
        bubble.appendChild(body);

        const actions = document.createElement("div");
        actions.className = "msg-actions";
        actions.innerHTML =
            '<button type="button" data-act="note">Update to notes</button>' +
            '<button type="button" data-act="download">Download</button>';
        actions.addEventListener("click", (e) => {
            const act = e.target.dataset.act;
            if (act === "note") saveNote(markdown, e.target);
            if (act === "download") downloadMarkdown(markdown);
        });

        wrap.append(bubble, actions);
        scrollToBottom();
    }

    function addError(message) {
        const wrap = document.createElement("div");
        wrap.className = "message assistant error";
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = message;
        wrap.appendChild(bubble);
        messagesEl.appendChild(wrap);
        scrollToBottom();
    }

    /* Actions */

    function saveNote(text, btn) {
        try {
            const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
            notes.push({ id: Date.now(), text, savedAt: new Date().toISOString() });
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
            const label = btn.textContent;
            btn.textContent = "Saved to notes";
            setTimeout(() => (btn.textContent = label), 1600);
        } catch {
            btn.textContent = "Could not save";
        }
    }

    function downloadMarkdown(text) {
        const blob = new Blob([text], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `verdeai_${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /* Sending */

    async function send(text) {
        busy = true;
        sendBtn.disabled = true;
        addUserMessage(text);
        const typing = addTyping();

        try {
            const res = await fetch(CHAT_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ message: text, history: history.slice(-HISTORY_LIMIT) }),
            });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);

            const data = await res.json();
            const reply = data.reply ?? data.message ?? data.response ?? "";
            if (!reply) throw new Error("The assistant returned an empty reply.");

            history.push({ role: "user", content: text }, { role: "assistant", content: reply });
            fillAssistant(typing, reply);
        } catch (err) {
            typing.remove();
            addError(err.message || "Something went wrong. Please try again.");
        } finally {
            busy = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    /* Input behaviour */

    function autoGrow() {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 160) + "px";
    }

    input.addEventListener("input", autoGrow);

    // Enter sends, Shift+Enter inserts a new line
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            form.requestSubmit();
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || busy) return;
        input.value = "";
        autoGrow();
        send(text);
    });
})();