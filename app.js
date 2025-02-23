// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import log from "loglevel";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Set logging level
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
const aiButton = document.getElementById('send-btn');
const aiInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');

let model;

// Get API Key for Chatbot
async function getApiKey() {
  let snapshot = await getDoc(doc(db, "apikey", "googlegenai"));
  let apiKey = snapshot.data().key;
  let genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// Chatbot API Call
async function askChatBot(request) {
  try {
    let response = await model.generateContent(request);
    let textResponse = response?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand.";
    appendMessage(`Bot: ${textResponse}`);
  } catch (error) {
    appendMessage("Error fetching chatbot response.");
  }
}

// Function to add a message to the chat history
function appendMessage(message) {
  let history = document.createElement("div");
  history.textContent = message;
  history.className = 'history';
  chatHistory.appendChild(history);
  aiInput.value = "";
}

// Function to fetch tasks from Firestore
async function getTasksFromFirestore() {
  const data = await getDocs(collection(db, "todos"));
  let tasks = [];
  data.forEach((doc) => tasks.push(doc));
  return tasks;
}

// Function to render tasks
async function renderTasks() {
  let tasks = await getTasksFromFirestore();
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    if (!task.data().completed) {
      const taskItem = document.createElement("li");
      taskItem.id = task.id;
      taskItem.textContent = task.data().text;
      taskItem.tabIndex = 0;
      taskList.appendChild(taskItem);
    }
  });
}

// Add task to Firestore
async function addTaskToFirestore(taskText) {
  if (!taskText) return;
  await addDoc(collection(db, "todos"), { text: taskText, completed: false });
  renderTasks();
}

// Remove Task by Name
async function removeFromTaskName(taskName) {
  let tasks = await getTasksFromFirestore();
  let removed = false;
  for (let task of tasks) {
    if (task.data().text.toLowerCase() === taskName.toLowerCase()) {
      await updateDoc(doc(db, "todos", task.id), { completed: true });
      removed = true;
    }
  }
  return removed;
}

// Chatbot Command Processing
function ruleChatBot(request) {
  if (request.startsWith("add task")) {
    let task = request.replace("add task", "").trim();
    if (task) {
      addTaskToFirestore(task);
      appendMessage(`Task "${task}" added!`);
    } else {
      appendMessage("Please specify a task to add.");
    }
    return true;
  } else if (request.startsWith("complete")) {
    let taskName = request.replace("complete", "").trim();
    if (taskName) {
      if (removeFromTaskName(taskName)) {
        appendMessage(`Task "${taskName}" marked as complete.`);
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

// Chatbot Event Listener
aiButton.addEventListener('click', async () => {
  let prompt = aiInput.value.trim().toLowerCase();
  if (prompt) {
    if (!ruleChatBot(prompt)) {
      askChatBot(prompt);
    }
  } else {
    appendMessage("Please enter a prompt");
  }
});

// Load tasks and API Key on page load
window.addEventListener('load', async () => {
  await getApiKey();
  renderTasks();
});