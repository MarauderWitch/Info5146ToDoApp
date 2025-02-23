// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
//deleteDocs
import log from "loglevel";

// Set logging level (options: "trace", "debug", "info", "warn", "error")
log.setLevel("info");

// Log application start
log.info("Application started");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj8Gby9nV5WLOfRlMDKRcW0isXQ5HACBU",
  authDomain: "info5146todoapp.firebaseapp.com",
  projectId: "info5146todoapp",
  storageBucket: "info5146todoapp.firebasestorage.app",
  messagingSenderId: "395951409528",
  appId: "1:395951409528:web:a022f4d7ca7bd6cb1aa08d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Function to sanitize input (Prevents XSS attacks)
function sanitizeInput(input) {
  const div = document.createElement("div");
  div.textContent = input; // Escapes any HTML tags
  return div.innerHTML;
}

// Function to fetch tasks from Firestore
async function getTasksFromFirestore() {
  try {
    log.info("Fetching tasks from Firestore...");
    const data = await getDocs(collection(db, "todos"));
    let userData = [];
    data.forEach((doc) => {
      userData.push(doc);
    });
    log.info(`Fetched ${userData.length} tasks`);
    return userData;
  } catch (error) {
    log.error("Error fetching tasks:", error);
    return [];
  }
}

// Function to render tasks in the UI
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

// Function to add a task to Firestore
async function addTaskToFirestore(taskText) {
  const sanitizedTaskText = sanitizeInput(taskText); // Sanitize user input
  try {
    log.info(`Adding task: ${sanitizedTaskText}`);
    await addDoc(collection(db, "todos"), {
      text: sanitizedTaskText,
      completed: false
    });
    log.info("Task added successfully");
    renderTasks(); // Refresh the task list after adding
  } catch (error) {
    log.error("Error adding task:", error);
  }
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