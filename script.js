document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =================================================
           AUTH SYSTEM
        ================================================= */

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        const registerForm =
            document.getElementById(
                "registerForm"
            );


        const showRegister =
            document.getElementById(
                "showRegister"
            );

        const showLogin =
            document.getElementById(
                "showLogin"
            );


        const loginButton =
            document.getElementById(
                "loginButton"
            );

        const registerButton =
            document.getElementById(
                "registerButton"
            );


        /* =================================================
           LOGIN / REGISTER PAGE
        ================================================= */

        if (
            loginForm &&
            registerForm
        ) {


            showRegister.addEventListener(
                "click",
                function () {

                    loginForm.classList.add(
                        "hidden"
                    );

                    registerForm.classList.remove(
                        "hidden"
                    );

                }
            );


            showLogin.addEventListener(
                "click",
                function () {

                    registerForm.classList.add(
                        "hidden"
                    );

                    loginForm.classList.remove(
                        "hidden"
                    );

                }
            );


            /* LOGIN */

            loginButton.addEventListener(
                "click",
                async function () {

                    const email =
                        document
                            .getElementById(
                                "loginEmail"
                            )
                            .value
                            .trim();

                    const password =
                        document
                            .getElementById(
                                "loginPassword"
                            )
                            .value;


                    const message =
                        document
                            .getElementById(
                                "loginMessage"
                            );


                    message.textContent =
                        "Logging in...";


                    try {

                        const response =
                            await fetch(
                                "/login",
                                {

                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({

                                            email:
                                                email,

                                            password:
                                                password

                                        })

                                }
                            );


                        const data =
                            await response.json();


                        if (
                            data.success
                        ) {

                            message.textContent =
                                "Login successful. Loading...";


                            window.location.href =
                                "/";

                        }
                        else {

                            message.textContent =
                                data.message ||
                                "Login failed.";

                        }


                    }
                    catch (error) {

                        console.error(
                            error
                        );

                        message.textContent =
                            "Connection error. Please try again.";

                    }

                }
            );


            /* REGISTER */

            registerButton.addEventListener(
                "click",
                async function () {


                    const name =
                        document
                            .getElementById(
                                "registerName"
                            )
                            .value
                            .trim();


                    const email =
                        document
                            .getElementById(
                                "registerEmail"
                            )
                            .value
                            .trim();


                    const password =
                        document
                            .getElementById(
                                "registerPassword"
                            )
                            .value;


                    const message =
                        document
                            .getElementById(
                                "registerMessage"
                            );


                    message.textContent =
                        "Creating account...";


                    try {


                        const response =
                            await fetch(
                                "/register",
                                {

                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({

                                            name:
                                                name,

                                            email:
                                                email,

                                            password:
                                                password

                                        })

                                }
                            );


                        const data =
                            await response.json();


                        if (
                            data.success
                        ) {

                            message.textContent =
                                "Account created. Loading...";


                            window.location.href =
                                "/";

                        }
                        else {

                            message.textContent =
                                data.message ||
                                "Registration failed.";

                        }


                    }
                    catch (error) {

                        console.error(
                            error
                        );

                        message.textContent =
                            "Connection error. Please try again.";

                    }

                }
            );


            return;

        }


        /* =================================================
           MAIN APP
        ================================================= */

        const messageInput =
            document.getElementById(
                "message"
            );


        const sendButton =
            document.getElementById(
                "sendButton"
            );


        const chatContainer =
            document.getElementById(
                "chatContainer"
            );


        const welcome =
            document.getElementById(
                "welcome"
            );


        const newChatButton =
            document.getElementById(
                "newChat"
            );


        const settingsButton =
            document.getElementById(
                "settingsButton"
            );


        const profileButton =
            document.getElementById(
                "profileButton"
            );


        const settingsModal =
            document.getElementById(
                "settingsModal"
            );


        const profileModal =
            document.getElementById(
                "profileModal"
            );


        const closeSettings =
            document.getElementById(
                "closeSettings"
            );


        const closeProfile =
            document.getElementById(
                "closeProfile"
            );


        const attachButton =
            document.getElementById(
                "attachButton"
            );


        let isSending = false;


        /* =================================================
           SEND
        ================================================= */

        sendButton.addEventListener(
            "click",
            sendMessage
        );


        /* =================================================
           ENTER
        ================================================= */

        messageInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );


        /* =================================================
           AUTO HEIGHT
        ================================================= */

        messageInput.addEventListener(
            "input",
            function () {

                this.style.height =
                    "auto";

                this.style.height =
                    Math.min(
                        this.scrollHeight,
                        150
                    ) + "px";

            }
        );


        /* =================================================
           SEND MESSAGE
        ================================================= */

        async function sendMessage() {


            if (isSending) {
                return;
            }


            const message =
                messageInput.value.trim();


            if (!message) {
                return;
            }


            isSending = true;


            if (welcome) {

                welcome.style.display =
                    "none";

            }


            addUserMessage(
                message
            );


            messageInput.value =
                "";

            messageInput.style.height =
                "auto";


            sendButton.disabled =
                true;


            sendButton.textContent =
                "⏳";


            const typing =
                createTypingIndicator();


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

                            body:
                                JSON.stringify({
                                    message:
                                        message
                                })

                        }
                    );


                const data =
                    await response.json();


                if (
                    typing
                ) {

                    typing.remove();

                }


                if (
                    response.status === 401 &&
                    data.login_required
                ) {

                    window.location.href =
                        "/";

                    return;

                }


                if (
                    data &&
                    data.reply
                ) {

                    await showAIReply(
                        data.reply
                    );

                }
                else {

                    addAIMessage(
                        "Zero4 AI did not return a response."
                    );

                }


            }
            catch (error) {


                console.error(
                    "ZERO4 ERROR:",
                    error
                );


                if (typing) {
                    typing.remove();
                }


                addAIMessage(
                    "Sorry bhai, connection mein problem aa gayi. Please try again."
                );

            }


            sendButton.disabled =
                false;


            sendButton.textContent =
                "➤";


            isSending =
                false;


            messageInput.focus();

        }


        /* =================================================
           USER MESSAGE
        ================================================= */

        function addUserMessage(
            text
        ) {


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "message user";


            div.textContent =
                text;


            chatContainer.appendChild(
                div
            );


            scrollBottom();

        }


        /* =================================================
           TYPING INDICATOR
        ================================================= */

        function createTypingIndicator() {


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "message ai typing-message";


            div.innerHTML = `

                <div class="typing-indicator">

                    <span></span>
                    <span></span>
                    <span></span>

                    <span class="typing-text">
                        Zero4 AI is thinking...
                    </span>

                </div>

            `;


            chatContainer.appendChild(
                div
            );


            scrollBottom();


            return div;

        }


        /* =================================================
           AI REPLY
        ================================================= */

        async function showAIReply(
            text
        ) {


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "message ai ai-answer";


            chatContainer.appendChild(
                div
            );


            const cleaned =
                cleanAIResponse(
                    text
                );


            renderMarkdown(
                div,
                cleaned
            );


            scrollBottom();


            await wait(100);

        }


        /* =================================================
           AI MESSAGE
        ================================================= */

        function addAIMessage(
            text
        ) {


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "message ai";


            renderMarkdown(
                div,
                cleanAIResponse(
                    text
                )
            );


            chatContainer.appendChild(
                div
            );


            scrollBottom();

        }


        /* =================================================
           MARKDOWN
        ================================================= */

        function renderMarkdown(
            element,
            text
        ) {


            let html;


            if (
                typeof marked !==
                "undefined"
            ) {

                html =
                    marked.parse(
                        text,
                        {
                            breaks: true,
                            gfm: true
                        }
                    );

            }
            else {

                html =
                    escapeHTML(
                        text
                    ).replace(
                        /\n/g,
                        "<br>"
                    );

            }


            if (
                typeof DOMPurify !==
                "undefined"
            ) {

                html =
                    DOMPurify.sanitize(
                        html
                    );

            }


            element.innerHTML =
                html;


            typesetMath(
                element
            );

        }


        /* =================================================
           MATHJAX
        ================================================= */

        function typesetMath(
            element
        ) {


            if (
                window.MathJax &&
                MathJax.typesetPromise
            ) {

                MathJax.typesetPromise(
                    [element]
                ).catch(
                    function (error) {

                        console.error(
                            "MathJax:",
                            error
                        );

                    }
                );

            }

        }


        /* =================================================
           CLEAN AI RESPONSE
        ================================================= */

        function cleanAIResponse(
            text
        ) {


            let result =
                String(
                    text || ""
                );


            result =
                result.replace(
                    /\r\n/g,
                    "\n"
                );


            /*
             * Convert LaTeX thousands separator.
             *
             * 123\,456
             * becomes
             * 123,456
             */

            result =
                result.replace(
                    /(\d)\\,(\d)/g,
                    "$1,$2"
                );


            /*
             * Remove spacing commands.
             */

            result =
                result.replace(
                    /\\!|\\;|\\:/g,
                    " "
                );


            /*
             * Common symbols.
             */

            result =
                result.replace(
                    /\\times/g,
                    "×"
                );


            result =
                result.replace(
                    /\\cdot/g,
                    "·"
                );


            result =
                result.replace(
                    /\\div/g,
                    "÷"
                );


            result =
                result.replace(
                    /\\pm/g,
                    "±"
                );


            result =
                result.replace(
                    /\\leq/g,
                    "≤"
                );


            result =
                result.replace(
                    /\\geq/g,
                    "≥"
                );


            result =
                result.replace(
                    /\\neq/g,
                    "≠"
                );


            result =
                result.replace(
                    /\\infty/g,
                    "∞"
                );


            /*
             * Remove left/right.
             */

            result =
                result.replace(
                    /\\left/g,
                    ""
                );


            result =
                result.replace(
                    /\\right/g,
                    ""
                );


            /*
             * Handle boxed answer.
             *
             * \boxed{123}
             *
             * becomes
             *
             * 123
             */

            result =
                result.replace(
                    /\\boxed\{([^{}]*)\}/g,
                    "$1"
                );


            /*
             * Handle text command.
             */

            result =
                result.replace(
                    /\\text\{([^{}]*)\}/g,
                    "$1"
                );


            /*
             * If aligned block exists,
             * convert it into display math.
             */

            result =
                result.replace(
                    /\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}/g,
                    function (
                        match,
                        content
                    ) {

                        return (
                            "$$\n" +
                            "\\begin{aligned}" +
                            content +
                            "\\end{aligned}" +
                            "\n$$"
                        );

                    }
                );


            /*
             * Clean excessive blank lines.
             */

            result =
                result.replace(
                    /\n{4,}/g,
                    "\n\n\n"
                );


            return result.trim();

        }


        /* =================================================
           ESCAPE HTML
        ================================================= */

        function escapeHTML(
            text
        ) {


            const div =
                document.createElement(
                    "div"
                );


            div.textContent =
                text;


            return div.innerHTML;

        }


        /* =================================================
           WAIT
        ================================================= */

        function wait(
            milliseconds
        ) {

            return new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        milliseconds
                    );

                }
            );

        }


        /* =================================================
           SCROLL
        ================================================= */

        function scrollBottom() {

            chatContainer.scrollTo({

                top:
                    chatContainer.scrollHeight,

                behavior:
                    "smooth"

            });

        }


        /* =================================================
           NEW CHAT
        ================================================= */

        newChatButton.addEventListener(
            "click",
            function () {


                chatContainer
                    .querySelectorAll(
                        ".message"
                    )
                    .forEach(
                        function (message) {

                            message.remove();

                        }
                    );


                if (welcome) {

                    welcome.style.display =
                        "flex";

                }


                messageInput.value =
                    "";

                messageInput.style.height =
                    "auto";

                messageInput.focus();

            }
        );


        /* =================================================
           SETTINGS
        ================================================= */

        settingsButton.addEventListener(
            "click",
            function () {

                settingsModal.style.display =
                    "flex";

            }
        );


        closeSettings.addEventListener(
            "click",
            function () {

                settingsModal.style.display =
                    "none";

            }
        );


        /* =================================================
           PROFILE
        ================================================= */

        profileButton.addEventListener(
            "click",
            function () {

                profileModal.style.display =
                    "flex";

            }
        );


        closeProfile.addEventListener(
            "click",
            function () {

                profileModal.style.display =
                    "none";

            }
        );


        /* =================================================
           MODAL OUTSIDE CLICK
        ================================================= */

        window.addEventListener(
            "click",
            function (event) {


                if (
                    event.target ===
                    settingsModal
                ) {

                    settingsModal.style.display =
                        "none";

                }


                if (
                    event.target ===
                    profileModal
                ) {

                    profileModal.style.display =
                        "none";

                }

            }
        );


        /* =================================================
           ATTACHMENT
        ================================================= */

        attachButton.addEventListener(
            "click",
            function () {

                alert(
                    "Attachments will be added soon 📎"
                );

            }
        );


        /* =================================================
           START
        ================================================= */

        messageInput.focus();

    }

);