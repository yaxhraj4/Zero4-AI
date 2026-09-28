let selectedFile = null;


function showRegister() {

    document
        .getElementById("loginBox")
        .classList
        .add("hidden");

    document
        .getElementById("registerBox")
        .classList
        .remove("hidden");

    document
        .getElementById("authMessage")
        .innerText = "";
}


function showLogin() {

    document
        .getElementById("registerBox")
        .classList
        .add("hidden");

    document
        .getElementById("loginBox")
        .classList
        .remove("hidden");

    document
        .getElementById("authMessage")
        .innerText = "";
}


function showAuthMessage(message) {

    document
        .getElementById("authMessage")
        .innerText = message;
}


async function login() {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    if (!email || !password) {

        showAuthMessage(
            "Please enter email and password."
        );

        return;
    }

    try {

        const response = await fetch(
            "/login",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        const data =
            await response.json();

        if (!data.success) {

            showAuthMessage(
                data.error ||
                "Login failed."
            );

            return;
        }

        window.location.reload();

    } catch (error) {

        showAuthMessage(
            "Network error. Please try again."
        );
    }
}


async function registerUser() {

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();

    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("registerPassword")
            .value;

    if (!name || !email || !password) {

        showAuthMessage(
            "Please fill all fields."
        );

        return;
    }

    try {

        const response = await fetch(
            "/register",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            }
        );

        const data =
            await response.json();

        if (!data.success) {

            showAuthMessage(
                data.error ||
                "Registration failed."
            );

            return;
        }

        window.location.reload();

    } catch (error) {

        showAuthMessage(
            "Network error. Please try again."
        );
    }
}


function handleEnter(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


function useSuggestion(text) {

    const input =
        document.getElementById(
            "messageInput"
        );

    input.value = text;

    input.focus();
}


function useImageSuggestion() {

    const input =
        document.getElementById(
            "messageInput"
        );

    input.value =
        "Create a cinematic futuristic city at night with neon lights, ultra detailed.";

    input.focus();
}


function getChatArea() {

    return document.getElementById(
        "chatArea"
    );
}


function removeWelcome() {

    const welcome =
        document.getElementById(
            "welcome"
        );

    if (welcome) {
        welcome.remove();
    }
}


function addUserMessage(text) {

    removeWelcome();

    const chatArea =
        getChatArea();

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message user-message";

    message.innerHTML = `
        <div class="message-avatar">
            You
        </div>

        <div class="message-content"></div>
    `;

    message
        .querySelector(".message-content")
        .textContent = text;

    chatArea.appendChild(
        message
    );

    scrollToBottom();
}


function addAIMessage(text) {

    const chatArea =
        getChatArea();

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message ai-message";

    message.innerHTML = `
        <div class="message-avatar ai-avatar">
            04
        </div>

        <div class="message-content"></div>
    `;

    message
        .querySelector(".message-content")
        .innerHTML =
        formatAIText(text);

    chatArea.appendChild(
        message
    );

    scrollToBottom();
}


function addImageMessage(imageData) {

    removeWelcome();

    const chatArea =
        getChatArea();

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message ai-message";

    message.innerHTML = `
        <div class="message-avatar ai-avatar">
            04
        </div>

        <div class="message-content image-message">

            <p>
                🖼️ Here's your generated image:
            </p>

            <img
                src="${imageData}"
                class="generated-image"
                alt="Generated image"
            >

            <a
                href="${imageData}"
                download="zero4-generated-image.png"
                class="download-image"
            >
                ⬇️ Save Image
            </a>

        </div>
    `;

    chatArea.appendChild(
        message
    );

    scrollToBottom();
}


function showTyping() {

    removeTyping();

    const chatArea =
        getChatArea();

    const typing =
        document.createElement(
            "div"
        );

    typing.id =
        "typingIndicator";

    typing.className =
        "message ai-message";

    typing.innerHTML = `
        <div class="message-avatar ai-avatar">
            04
        </div>

        <div class="typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chatArea.appendChild(
        typing
    );

    scrollToBottom();
}


function removeTyping() {

    const typing =
        document.getElementById(
            "typingIndicator"
        );

    if (typing) {
        typing.remove();
    }
}


async function sendMessage() {

    const input =
        document.getElementById(
            "messageInput"
        );

    const text =
        input.value.trim();

    if (!text && !selectedFile) {
        return;
    }

    if (selectedFile) {

        await sendAttachment(
            text
        );

        return;
    }

    addUserMessage(text);

    input.value = "";

    showTyping();

    setSendingState(true);

    try {

        const response =
            await fetch(
                "/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text
                    })
                }
            );

        const data =
            await response.json();

        removeTyping();

        if (!data.success) {

            addAIMessage(
                "⚠️ " +
                (
                    data.error ||
                    "Something went wrong."
                )
            );

            return;
        }

        addAIMessage(
            data.answer
        );

    } catch (error) {

        removeTyping();

        addAIMessage(
            "⚠️ Network error. Please try again."
        );

    } finally {

        setSendingState(false);
    }
}


async function generateImage() {

    const input =
        document.getElementById(
            "messageInput"
        );

    const prompt =
        input.value.trim();

    if (!prompt) {

        input.focus();

        input.placeholder =
            "Describe the image you want...";

        return;
    }

    addUserMessage(
        "🖼️ Generate image: " +
        prompt
    );

    input.value = "";

    showTyping();

    setSendingState(true);

    try {

        const response =
            await fetch(
                "/generate-image",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        prompt: prompt
                    })
                }
            );

        const data =
            await response.json();

        removeTyping();

        if (!data.success) {

            addAIMessage(
                "⚠️ " +
                (
                    data.error ||
                    "Image generation failed."
                )
            );

            return;
        }

        addImageMessage(
            data.image
        );

    } catch (error) {

        removeTyping();

        addAIMessage(
            "⚠️ Could not connect to image generation."
        );

    } finally {

        setSendingState(false);
    }
}


function openFilePicker() {

    document
        .getElementById("fileInput")
        .click();
}


function handleFileSelected(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    const maxSize =
        200 * 1024 * 1024;

    if (file.size > maxSize) {

        alert(
            "Maximum file size is 200 MB."
        );

        event.target.value = "";

        return;
    }

    selectedFile = file;

    const preview =
        document.getElementById(
            "attachmentPreview"
        );

    preview.classList.remove(
        "hidden"
    );

    preview.innerHTML = `
        <div class="attachment-item">

            <span>
                📎
                ${escapeHTML(file.name)}
            </span>

            <button
                type="button"
                onclick="removeAttachment()"
            >
                ×
            </button>

        </div>
    `;
}


function removeAttachment() {

    selectedFile = null;

    document
        .getElementById("fileInput")
        .value = "";

    const preview =
        document.getElementById(
            "attachmentPreview"
        );

    preview.innerHTML = "";

    preview.classList.add(
        "hidden"
    );
}


async function sendAttachment(message) {

    if (!selectedFile) {
        return;
    }

    const fileName =
        selectedFile.name;

    addUserMessage(
        "📎 " +
        fileName +
        (
            message
                ? "\n" + message
                : ""
        )
    );

    showTyping();

    setSendingState(true);

    const formData =
        new FormData();

    formData.append(
        "file",
        selectedFile
    );

    formData.append(
        "message",
        message || ""
    );

    try {

        const response =
            await fetch(
                "/analyze-file",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        removeTyping();

        if (!data.success) {

            addAIMessage(
                "⚠️ " +
                (
                    data.error ||
                    "Could not analyze the attachment."
                )
            );

            return;
        }

        addAIMessage(
            data.answer
        );

    } catch (error) {

        removeTyping();

        addAIMessage(
            "⚠️ Could not upload the attachment."
        );

    } finally {

        setSendingState(false);

        removeAttachment();
    }
}


function setSendingState(isSending) {

    const sendButton =
        document.getElementById(
            "sendButton"
        );

    const imageButton =
        document.getElementById(
            "imageButton"
        );

    if (!sendButton || !imageButton) {
        return;
    }

    sendButton.disabled =
        isSending;

    imageButton.disabled =
        isSending;

    sendButton.style.opacity =
        isSending ? "0.5" : "1";

    imageButton.style.opacity =
        isSending ? "0.5" : "1";
}


function newChat() {

    const chatArea =
        getChatArea();

    chatArea.innerHTML = `

        <div
            id="welcome"
            class="welcome"
        >

            <div class="welcome-logo">
                04
            </div>

            <h1>
                What can I help you with?
            </h1>

            <p>
                Ask Zero4 AI Flash anything.
            </p>

            <div class="suggestions">

                <button
                    type="button"
                    onclick="useSuggestion('Explain Python in simple Hinglish')"
                >
                    🐍 Explain Python
                </button>

                <button
                    type="button"
                    onclick="useSuggestion('Solve 25 × 16 step by step')"
                >
                    🧮 Solve Maths
                </button>

                <button
                    type="button"
                    onclick="useImageSuggestion()"
                >
                    🖼️ Generate Image
                </button>

                <button
                    type="button"
                    onclick="useSuggestion('Write a Python calculator program')"
                >
                    💻 Write Code
                </button>

            </div>

        </div>
    `;

    removeAttachment();
}


async function showProfile() {

    const modal =
        document.getElementById(
            "profileModal"
        );

    const content =
        document.getElementById(
            "profileContent"
        );

    modal.classList.remove(
        "hidden"
    );

    content.innerHTML =
        "Loading...";

    try {

        const response =
            await fetch("/me");

        const data =
            await response.json();

        if (!data.success) {

            content.innerHTML =
                "Could not load profile.";

            return;
        }

        const user =
            data.user;

        content.innerHTML = `

            <div class="profile-info">

                <p>
                    <strong>Name</strong>

                    <span>
                        ${escapeHTML(user.name)}
                    </span>
                </p>

                <p>
                    <strong>Email</strong>

                    <span>
                        ${escapeHTML(user.email)}
                    </span>
                </p>

                <p>
                    <strong>Plan</strong>

                    <span>
                        ${escapeHTML(user.plan)}
                    </span>
                </p>

            </div>
        `;

    } catch (error) {

        content.innerHTML =
            "Could not load profile.";
    }
}


function showSettings() {

    document
        .getElementById(
            "settingsModal"
        )
        .classList
        .remove("hidden");
}


function closeModals() {

    document
        .getElementById(
            "profileModal"
        )
        .classList
        .add("hidden");

    document
        .getElementById(
            "settingsModal"
        )
        .classList
        .add("hidden");
}


window.addEventListener(
    "click",
    function(event) {

        const profileModal =
            document.getElementById(
                "profileModal"
            );

        const settingsModal =
            document.getElementById(
                "settingsModal"
            );

        if (
            event.target ===
            profileModal
        ) {

            profileModal
                .classList
                .add("hidden");
        }

        if (
            event.target ===
            settingsModal
        ) {

            settingsModal
                .classList
                .add("hidden");
        }
    }
);


function formatAIText(text) {

    let escaped =
        escapeHTML(text);

    escaped =
        escaped.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

    escaped =
        escaped.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );

    escaped =
        escaped.replace(
            /\n/g,
            "<br>"
        );

    return escaped;
}


function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


function scrollToBottom() {

    const chatArea =
        getChatArea();

    setTimeout(
        function() {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        },
        50
    );
}
