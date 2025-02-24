import { doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where } from "firebase/firestore";
import { db } from "../js/firebase.js";  // ✅ Ensure Firestore is properly imported
import log from "loglevel";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Set logging level (options: "trace", "debug", "info", "warn", "error")
log.setLevel("info");

// Log application start
log.info(`Application started`);

// ✅ Fetch email from localStorage
const email = localStorage.getItem("email") ? JSON.parse(localStorage.getItem("email")) : null;

if (!email) {
    console.warn("No email found. Redirecting to login page...");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

// ✅ Wait for the DOM to fully load before attaching event listeners
document.addEventListener("DOMContentLoaded", function () {
    console.log(`DOM fully loaded, attaching event listeners...`);

    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const aiButton = document.getElementById('send-btn');
    const aiInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const signOutBttn = document.getElementById("signOutBttn");

    if (!taskInput || !addTaskBtn || !taskList || !aiButton || !aiInput || !chatHistory || !signOutBttn) {
        console.error("One or more elements not found! Check your HTML.");
        return;
    }

    // ✅ Add Task Button Event Listener
    addTaskBtn.addEventListener('click', async () => {
        console.log("✅ Add Task button clicked!");
        const taskText = taskInput.value.trim();
        if (taskText) {
            console.log(`🔥 Adding task: ${taskText}`);
            await addTaskToFirestore(taskText);
            taskInput.value = ""; // ✅ Clear input after adding task
        } else {
            alert("⚠️ Please enter a task!");
        }
    });

    aiButton.addEventListener('click', async () => {
        let prompt = aiInput.value.trim().toLowerCase();
        if (prompt) {
            console.log(`🤖 Chatbot received: ${prompt}`);
        } else {
            appendMessage("⚠️ Please enter a prompt");
        }
    });

    signOutBttn.addEventListener("click", function () {
        console.log("🚪 User signed out.");
        localStorage.removeItem("email");
        window.location.href = "index.html";
    });
});

// ✅ Function to sanitize input
function sanitizeInput(input) {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
}

// ✅ Add Task to Firestore
async function addTaskToFirestore(taskText) {
    if (!email) {
        console.error("⚠️ Error: Email is missing. Task cannot be saved.");
        return;
    }

    try {
        console.log(`🔥 Saving task: ${taskText} for user: ${email}`);

        const docRef = await addDoc(collection(db, "todos"), {
            text: taskText,
            email: email,
            completed: false
        });

        console.log(`✅ Task saved successfully with ID: ${docRef.id}`);
        await renderTasks(); // ✅ Refresh the task list after adding

    } catch (error) {
        console.error("❌ Error adding task:", error);
    }
}

// ✅ Fetch Tasks from Firestore
async function getTasksFromFirestore() {
    if (!email) {
        console.error("⚠️ Error: Email is missing. Cannot fetch tasks.");
        return [];
    }

    try {
        console.log(`🔍 Fetching tasks for email: ${email}`);
        let q = query(collection(db, "todos"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        return querySnapshot; // ✅ Returns tasks properly

    } catch (error) {
        console.error("❌ Error fetching tasks:", error);
        return [];
    }
}

// ✅ Render Tasks in UI
async function renderTasks() {
    console.log(`🔄 Fetching tasks from Firestore...`);

    const querySnapshot = await getTasksFromFirestore();
    taskList.innerHTML = ""; // ✅ Clear existing tasks before rendering

    querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        console.log(`📝 Rendering task: ${doc.id} - ${taskData.text}`);

        if (!taskData.completed) {
            const taskItem = document.createElement("li");
            taskItem.id = doc.id;
            taskItem.textContent = taskData.text;
            taskItem.tabIndex = 0; // ✅ Make tasks keyboard navigable

            taskList.appendChild(taskItem);
        }
    });

    console.log(`✅ Rendered ${querySnapshot.size} tasks.`);
}

// ✅ Load tasks when page is loaded
window.addEventListener('load', renderTasks);

// ✅ Mark Task as Completed on Enter Key Press
taskList.addEventListener("keypress", async function(e) {
    if (e.target.tagName === 'LI' && e.key === "Enter") {
        try {
            log.info(`✅ Marking task as completed: ${e.target.id}`);
            await updateDoc(doc(db, "todos", e.target.id), { completed: true });
            log.info(`✅ Task ${e.target.id} marked as completed`);
            renderTasks();
        } catch (error) {
            log.error("❌ Error updating task:", error);
        }
    }
});

// ✅ Service Worker Registration
const sw = new URL('service-worker.js', import.meta.url);
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(sw.href, { scope: '/Info5146ToDoApp/' })
        .then(() => log.info('✅ Service Worker Registered successfully'))
        .catch(err => log.error('❌ Service Worker Error:', err));
}

// ✅ Global Error Logging
window.addEventListener('error', function (event) { 
    log.error('❌ Global Error occurred:', event.message); 
});