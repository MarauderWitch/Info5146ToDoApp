import { doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where } from "firebase/firestore";
import { db } from "/firebase.js";
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

// ✅ Function to sanitize input
function sanitizeInput(input) {
    const div = document.createElement("div");
    div.textContent = input.trim();
    return div.innerHTML;
}

// ✅ Call API Key on Page Load
async function getApiKey() {
    try {
        let snapshot = await getDoc(doc(db, "apikey", "googlegenai"));
        let apiKey = snapshot.data().key;
        let genAI = new GoogleGenerativeAI(apiKey);
        let model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("✅ API Key retrieved successfully");
    } catch (error) {
        console.error("❌ Error retrieving API Key:", error);
    }
}

// ✅ Add Task to Firestore
async function addTaskToFirestore(taskText) {
    if (!email) {
        console.error("⚠️ Error: Email is missing. Task cannot be saved.");
        return;
    }

    try {
        let sanitizedText = sanitizeInput(taskText);
        console.log(`🔥 Saving task: ${sanitizedText} for user: ${email}`);

        const docRef = await addDoc(collection(db, "todos"), {
            text: sanitizedText,
            email: email,
            completed: false
        });

        console.log(`✅ Task saved successfully with ID: ${docRef.id}`);
        await renderTasks();

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
        return await getDocs(q);

    } catch (error) {
        console.error("❌ Error fetching tasks:", error);
        return [];
    }
}

// ✅ Mark Task as Completed
async function markTaskAsCompleted(taskId) {
    try {
        console.log(`✅ Marking task as completed: ${taskId}`);
        await updateDoc(doc(db, "todos", taskId), { completed: true });
        console.log(`✅ Task ${taskId} marked as completed.`);
        await renderTasks(); // Refresh task list after marking as complete
    } catch (error) {
        console.error("❌ Error updating task:", error);
    }
}

// ✅ Render Tasks in UI with Click-to-Complete
async function renderTasks() {
    console.log(`🔄 Fetching tasks from Firestore...`);

    const querySnapshot = await getTasksFromFirestore();
    const taskList = document.getElementById("taskList");

    if (!taskList) {
        console.error("❌ Task list element not found!");
        return;
    }

    taskList.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        console.log(`📝 Rendering task: ${doc.id} - ${taskData.text}`);

        if (!taskData.completed) {
            const taskItem = document.createElement("li");
            taskItem.id = doc.id;
            taskItem.textContent = taskData.text;
            taskItem.tabIndex = 0;

            // ✅ Add click event listener to mark task as completed
            taskItem.addEventListener("click", async () => {
                await markTaskAsCompleted(doc.id);
            });

            taskItem.addEventListener("keypress", async (event) => {
                if (event.key === "Enter") {
                    await markTaskAsCompleted(doc.id);
                }
            });

            taskList.appendChild(taskItem);
        }
    });

    console.log(`✅ Rendered ${querySnapshot.size} tasks.`);
}

function appendMessage(message) {
    let history = document.createElement("div");
    history.textContent = message;
    history.className = 'history';
    chatHistory.appendChild(history);
    aiInput.value = "";
  }
  
  function removeFromTaskName(task) {
    let ele = document.getElementsByName(task);
    if(ele.length == 0){
      return false;
    }
    ele.forEach(e => {
      removeTask(e.id);
      removeVisualTask(e.id);
    })
    return true;
}

function ruleChatBot(request) {
    if (request.startsWith("add task")) {
      let task = request.replace("add task", "").trim();
      if (task) {
          addTaskToFirestore(task);
          appendMessage('Task ' + task + ' added!');
      } else {
          appendMessage("Please specify a task to add.");
      }
      return true;
    } else if (request.startsWith("complete")) {
        let taskName = request.replace("complete", "").trim();
        if (taskName) {
            if(removeFromTaskName(taskName)) {
              appendMessage('Task ' + taskName + ' marked as complete.');
            } else {
              appendMessage("Task not found!");
            }
            
        } else {
            appendMessage("Please specify a task to complete.");
        }
        return true;
    }
  
    return false;
  }

// ✅ Wait for the DOM to fully load before attaching event listeners
document.addEventListener("DOMContentLoaded", function () {
    console.log(`DOM fully loaded, attaching event listeners...`);

    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const aiButton = document.getElementById('send-btn');
    const aiInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const signOutBttn = document.getElementById("signOutBttn");

    if (!taskInput || !addTaskBtn || !aiButton || !aiInput || !chatHistory || !signOutBttn) {
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
            taskInput.value = "";
        } else {
            alert("⚠️ Please enter a task!");
        }
    });

    taskInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
          addTaskBtn.click();
        }
      });

    aiButton.addEventListener('click', async () => {
        let prompt = aiInput.value.trim().toLowerCase();
        if(prompt) {
          if(!ruleChatBot(prompt)){
            askChatBot(prompt);
          }
        } else {
          appendMessage("Please enter a prompt")
        }  
    });

    signOutBttn.addEventListener("click", function () {
        console.log("🚪 User signed out.");
        localStorage.removeItem("email");
        window.location.href = "index.html";
    });

    // ✅ Load tasks when page is loaded
    renderTasks();

    // ✅ Retrieve API key on page load
    getApiKey();
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