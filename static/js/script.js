// =========================
// Select Elements
// =========================

const browseBtn = document.getElementById("browseBtn");
const cameraBtn = document.getElementById("cameraBtn");
const fileInput = document.getElementById("fileInput");
const cameraInput = document.getElementById("cameraInput");
const previewImage = document.getElementById("previewImage");
const previewFrame = document.getElementById("previewFrame");
const predictBtn = document.getElementById("predictBtn");

const resultCard = document.getElementById("resultCard");
const prediction = document.getElementById("prediction");
const confidence = document.getElementById("confidence");
const predictionStatus = document.getElementById("predictionStatus");
const dropArea = document.getElementById("dropArea");

// Camera Modal Elements
const cameraModal = document.getElementById("cameraModal");
const webcamVideo = document.getElementById("webcamVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const cameraErrorMsg = document.getElementById("cameraErrorMsg");
const fallbackCameraBtn = document.getElementById("fallbackCameraBtn");
const modalControls = document.getElementById("modalControls");

// Active selected file for prediction
let selectedFile = null;
let currentStream = null;
let currentFacingMode = "environment";

// =========================
// Theme Toggle
// =========================

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("cnd-theme", "light");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("cnd-theme", "dark");
        }
    });
}

// =========================
// Set Selected File & Preview
// =========================

function setFile(file) {
    if (!file) return;

    selectedFile = file;

    const reader = new FileReader();

    reader.onload = function (e) {
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
        predictBtn.disabled = false;
        resultCard.style.display = "none";
    };

    reader.readAsDataURL(file);
}

// =========================
// Browse & Camera Button Handlers
// =========================

browseBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
        setFile(this.files[0]);
    }
});

cameraInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
        setFile(this.files[0]);
    }
});

// Detect mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// =========================
// Take Photo Handler
// =========================

cameraBtn.addEventListener("click", () => {
    // On mobile devices, triggering native cameraInput.click() directly in the user click event
    // opens the device camera app natively with camera permission request.
    if (isMobileDevice() || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraInput.click();
    } else {
        // On desktop/laptop with WebRTC support, open live camera stream modal
        startWebcam();
    }
});

if (fallbackCameraBtn) {
    fallbackCameraBtn.addEventListener("click", () => {
        closeCameraModal();
        cameraInput.click();
    });
}

// =========================
// WebRTC Live Camera Modal
// =========================

async function startWebcam() {
    stopWebcamStream();
    webcamVideo.style.display = "block";
    cameraErrorMsg.style.display = "none";
    modalControls.style.display = "flex";

    const constraints = {
        video: {
            facingMode: { ideal: currentFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        webcamVideo.srcObject = currentStream;
        cameraModal.style.display = "flex";
    } catch (err) {
        console.warn("Primary facingMode getUserMedia failed, trying fallback:", err);
        try {
            currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcamVideo.srcObject = currentStream;
            cameraModal.style.display = "flex";
        } catch (fallbackErr) {
            console.error("Camera access error:", fallbackErr);
            webcamVideo.style.display = "none";
            cameraErrorMsg.style.display = "block";
            modalControls.style.display = "none";
            cameraModal.style.display = "flex";
        }
    }
}

function stopWebcamStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

function closeCameraModal() {
    stopWebcamStream();
    cameraModal.style.display = "none";
}

closeCameraBtn.addEventListener("click", closeCameraModal);

cameraModal.addEventListener("click", (e) => {
    if (e.target === cameraModal) {
        closeCameraModal();
    }
});

switchCameraBtn.addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startWebcam();
});

captureBtn.addEventListener("click", () => {
    if (!webcamVideo.videoWidth || !webcamVideo.videoHeight) {
        alert("Camera stream is initializing. Please wait a moment.");
        return;
    }

    cameraCanvas.width = webcamVideo.videoWidth;
    cameraCanvas.height = webcamVideo.videoHeight;

    const ctx = cameraCanvas.getContext("2d");
    ctx.drawImage(webcamVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

    cameraCanvas.toBlob((blob) => {
        if (!blob) {
            alert("Failed to capture photo from camera.");
            return;
        }
        const capturedFile = new File([blob], `camera_note_${Date.now()}.jpg`, { type: "image/jpeg" });
        setFile(capturedFile);
        closeCameraModal();
    }, "image/jpeg", 0.95);
});

// =========================
// Drag & Drop
// =========================

dropArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropArea.classList.add("drag-over");
});

dropArea.addEventListener("dragleave", function () {
    dropArea.classList.remove("drag-over");
});

dropArea.addEventListener("drop", function (e) {
    e.preventDefault();
    dropArea.classList.remove("drag-over");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setFile(e.dataTransfer.files[0]);
    }
});

const reasonRow = document.getElementById("reasonRow");
const reasonText = document.getElementById("reasonText");
const probabilitiesList = document.getElementById("probabilitiesList");

// =========================
// AI Verification Assistant (Chat)
// =========================

const chatBody = document.getElementById("chatBody");
const chatEmpty = document.getElementById("chatEmpty");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatSuggestions = document.getElementById("chatSuggestions");

let chatHistory = [];          // [{role: "user"|"model", text: "..."}]
let predictionContext = null;  // last prediction result, sent to backend for grounding

function addChatMessage(role, text) {
    if (chatEmpty) chatEmpty.style.display = "none";

    const bubble = document.createElement("div");
    bubble.className = "chat-msg " + role;
    bubble.textContent = text;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
    return bubble;
}

function showTypingIndicator() {
    const el = document.createElement("div");
    el.className = "typing-indicator";
    el.id = "typingIndicator";
    el.innerHTML = "<span></span><span></span><span></span>";
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
}

function setChatEnabled(enabled) {
    chatInput.disabled = !enabled;
    sendChatBtn.disabled = !enabled;
    if (chatSuggestions) chatSuggestions.style.display = enabled ? "flex" : "none";
}

async function sendChatMessage(text) {
    const message = (text !== undefined ? text : chatInput.value).trim();
    if (!message) return;

    chatInput.value = "";
    chatInput.style.height = "auto";
    addChatMessage("user", message);

    setChatEnabled(false);
    showTypingIndicator();

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                history: chatHistory,
                context: predictionContext
            })
        });

        const data = await res.json();

        hideTypingIndicator();

        if (data.error) {
            addChatMessage("error", data.error);
        } else {
            chatHistory.push({ role: "user", text: message });
            addChatMessage("assistant", data.reply);
            chatHistory.push({ role: "model", text: data.reply });
        }
    } catch (err) {
        hideTypingIndicator();
        addChatMessage("error", "Couldn't reach the assistant. Please try again.");
        console.error(err);
    } finally {
        setChatEnabled(true);
        chatInput.focus();
    }
}

if (sendChatBtn) {
    sendChatBtn.addEventListener("click", () => sendChatMessage());
}

if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    chatInput.addEventListener("input", () => {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 90) + "px";
    });
}

if (chatSuggestions) {
    chatSuggestions.querySelectorAll(".chip-btn").forEach(chip => {
        chip.addEventListener("click", () => sendChatMessage(chip.dataset.q));
    });
}

// =========================
// Predict Button
// =========================

predictBtn.addEventListener("click", function () {
    if (!selectedFile) {
        alert("Please upload or take a photo of an image first.");
        return;
    }

    predictBtn.innerHTML = "Scanning...";
    predictBtn.disabled = true;
    if (previewFrame) previewFrame.classList.add("scanning");

    // Reset chat for a new scan
    chatHistory = [];
    predictionContext = null;
    if (chatBody) {
        chatBody.innerHTML = "";
        const empty = document.createElement("div");
        empty.className = "chat-empty";
        empty.id = "chatEmpty";
        empty.textContent = "Analyzing your note...";
        chatBody.appendChild(empty);
    }
    setChatEnabled(false);

    const formData = new FormData();
    formData.append("image", selectedFile);

    fetch("/predict", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Error: " + data.error);
                return;
            }

            resultCard.style.display = "block";
            prediction.innerHTML = data.prediction;
            confidence.innerHTML = data.confidence + "%";

            if (data.is_supported === false || data.prediction === "Cannot Determine") {
                predictionStatus.innerHTML = "⚠️ Cannot Determine";
                predictionStatus.style.color = "var(--fake)";
                if (reasonRow) {
                    reasonRow.style.display = "flex";
                    reasonText.innerHTML = data.reason || "Unsupported note or confidence too low.";
                }
            } else {
                if (reasonRow) {
                    reasonRow.style.display = "none";
                }
                if (data.prediction.toLowerCase().includes("fake")) {
                    predictionStatus.innerHTML = "❌ Fake Note";
                    predictionStatus.style.color = "var(--fake)";
                } else {
                    predictionStatus.innerHTML = "✅ Genuine Note";
                    predictionStatus.style.color = "var(--real)";
                }
            }

            // Render Prediction Probabilities Breakdown
            if (probabilitiesList && Array.isArray(data.probabilities)) {
                probabilitiesList.innerHTML = "";
                data.probabilities.forEach(item => {
                    const probItem = document.createElement("div");
                    probItem.className = "prob-item";

                    const isFake = item.class_name.toLowerCase().includes("fake");
                    const fillClass = isFake ? "fake" : "real";

                    probItem.innerHTML = `
                        <div class="prob-header">
                            <span class="prob-name">${item.class_name}</span>
                            <span class="prob-pct">${item.probability.toFixed(2)}%</span>
                        </div>
                        <div class="prob-bar-bg">
                            <div class="prob-bar-fill ${fillClass}" style="width: ${Math.min(Math.max(item.probability, 0), 100)}%;"></div>
                        </div>
                    `;
                    probabilitiesList.appendChild(probItem);
                });
            }

            // Seed the chat with the model's opening analysis
            predictionContext = {
                prediction: data.prediction,
                confidence: data.confidence,
                is_supported: data.is_supported,
                reason: data.reason,
                probabilities: data.probabilities
            };

            if (chatBody) chatBody.innerHTML = "";
            if (data.ai_analysis) {
                addChatMessage("assistant", data.ai_analysis);
                chatHistory.push({ role: "model", text: data.ai_analysis });
            }
            setChatEnabled(true);
        })
        .catch(error => {
            alert("Prediction Failed");
            console.error(error);
            if (chatBody) {
                chatBody.innerHTML = "";
                const empty = document.createElement("div");
                empty.className = "chat-empty";
                empty.id = "chatEmpty";
                empty.textContent = "Scan a note on the left — I'll explain the result and you can ask me anything about verifying it.";
                chatBody.appendChild(empty);
            }
        })
        .finally(() => {
            predictBtn.innerHTML = "Predict Note";
            predictBtn.disabled = false;
            if (previewFrame) previewFrame.classList.remove("scanning");
        });
});
