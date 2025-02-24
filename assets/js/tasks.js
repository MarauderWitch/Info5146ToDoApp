import { doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where } from "firebase/firestore";
//deleteDocs
import log from "loglevel";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Set logging level (options: "trace", "debug", "info", "warn", "error")
log.setLevel("info");

// Log application start
log.info("Application started");

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded, attaching event listeners...");

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

    // ✅ Now add event listeners safely
    addTaskBtn.addEventListener('click', async () => {
        console.log("Add Task button clicked!");
        const taskText = taskInput.value.trim();
        if (taskText) {
            console.log(`Adding task: ${taskText}`);
            taskInput.value = "";
        } else {
            alert("Please enter a task!");
        }
    });

    aiButton.addEventListener('click', async () => {
        let prompt = aiInput.value.trim().toLowerCase();
        if (prompt) {
            console.log(`Chatbot received: ${prompt}`);
        } else {
            appendMessage("Please enter a prompt");
        }
    });

    signOutBttn.addEventListener("click", function () {
        console.log("User signed out.");
        localStorage.removeItem("email");
        window.location.href = "index.html";
    });
});


// Function to sanitize input
function sanitizeInput(input) {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
}

if(!email){
    window.location.href = "index.html";
}

async function renderTasks() {
    var tasks = await getTasksFromFirestore();
    taskList.innerHTML = ""; // Clear existing tasks
  
    tasks.forEach((task) => {
      if (!task.data().completed) {
        const taskItem = document.createElement("li");
        taskItem.id = task.id;
        taskItem.textContent = task.data().text;
        taskItem.tabIndex = 0; // ✅ Make tasks keyboard navigable
  
        taskList.appendChild(taskItem);
      }
    });
    log.info("Tasks rendered successfully");
}

async function addTaskToFirestore(taskText) {
    let task = await addDoc(collection(db, "todos"), {
      text: taskText,
      email: email, 
      completed: false
    });  
    return task.id;
}

async function getTasksFromFirestore() {
    let q = query(collection(db, "todos"), where("email", "==", email));
    return await getDocs(q);
}

//Call in the event listener for page load
async function getApiKey() {
    let snapshot = await getDoc(doc(db, "apikey", "googlegenai"));
    apiKey =  snapshot.data().key;
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  
  async function askChatBot(request) {
    return await model.generateContent(request);
  }
  
  function ruleChatBot(request) {
    if (request.startsWith("add task")) {
      let task = request.replace("add task", "").trim();
      if (task) {
          addTask(task);
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
  
  // Add Task Button Event Listener
  addTaskBtn.addEventListener('click', async () => {
    const taskText = sanitizeInput(taskInput.value.trim()); // Sanitize before saving
    if (taskText) {
      log.info(`User clicked "Add Task" with input: ${taskText}`);
      await addTaskToFirestore(taskText);
      taskInput.value = "";
    } else {
      log.warn("User tried to add an empty task");
      alert("Please enter a task!"); // ✅ Show an alert for empty input
    }
  });
  
  // ✅ Add Task on Enter Key Press
  taskInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      addTaskBtn.click(); // Simulate button click
    }
  });
  
  // ✅ Mark Task as Completed on Enter Key Press
  taskList.addEventListener("keypress", async function(e) {
    if (e.target.tagName === 'LI' && e.key === "Enter") {
      try {
        log.info(`Marking task as completed: ${e.target.id}`);
        await updateDoc(doc(db, "todos", e.target.id), { completed: true });
        log.info(`Task ${e.target.id} marked as completed`);
        renderTasks(); // Refresh the UI
      } catch (error) {
        log.error("Error updating task:", error);
      }
    }
  });
  
  // Error Logging
  window.addEventListener('error', function (event) { 
    log.error('Global Error occurred:', event.message); 
  });

signOutBttn.addEventListener("click", function(event) {
    localStorage.removeItem("email");
    window.location.href = "index.html";
});

// Service Worker Registration
const sw = new URL('service-worker.js', import.meta.url);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(sw.href, { scope: '/Info5146ToDoApp/' })
    .then(() => log.info('Service Worker Registered successfully'))
    //then(_
    .catch(err => log.error('Service Worker Error:', err));
}

// Load tasks on page load
window.addEventListener('load', renderTasks);