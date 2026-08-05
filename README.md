# 💵 Currency Note Detection using CNN

An intelligent web application that detects the authenticity of Indian ₹500 and ₹2000 currency notes using a Convolutional Neural Network (CNN). The project is built with TensorFlow, Flask, and Google Gemini AI to provide both prediction and informative insights about the detected currency note.

---

## 📌 Project Overview

Counterfeit currency is a significant concern in today's economy. This project leverages Deep Learning to classify Indian ₹500 and ₹2000 currency notes as **Real** or **Fake**.

Users can upload an image of a currency note through a user-friendly web interface. The trained CNN model predicts the class, and Google Gemini AI generates useful information about the detected note.

---

## ✨ Features

- 🧠 Deep Learning based Currency Detection
- 💰 Supports Indian ₹500 and ₹2000 Notes
- ✅ Detects Real and Fake Currency Notes
- 📷 Upload Image through Web Interface
- ⚡ Fast Prediction using TensorFlow/Keras
- 🤖 Gemini AI Integration for Additional Information
- 🎨 Modern Responsive User Interface using Flask
- 📊 Trained CNN Model Included

---

## 🛠️ Tech Stack

### Programming Language
- Python

### Machine Learning
- TensorFlow
- Keras
- NumPy
- Pillow

### Backend
- Flask

### Frontend
- HTML
- CSS
- JavaScript

### AI Integration
- Google Gemini API

### Tools
- Jupyter Notebook
- VS Code

---

## 📂 Project Structure

```
Currency-Detection-Model-CNN/
│
├── model/
│   └── Currency_CNN.keras
│
├── static/
│
├── templates/
│
├── uploads/
│
├── app.py
├── requirements.txt
├── Currency_Detection.ipynb
├── README.md
└── .gitignore
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/ankithgj31/Currency-Detection-Model-CNN-.git
```

Move into the project directory

```bash
cd Currency-Detection-Model-CNN-
```

Create Virtual Environment (Optional)

```bash
python -m venv venv
```

Activate Virtual Environment

Windows

```bash
venv\Scripts\activate
```

Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root.

```env
GEMINI_API_KEY=YOUR_API_KEY
```

---

## ▶️ Run the Application

```bash
python app.py
```

Open your browser and visit

```
http://127.0.0.1:5000
```

---

## 🧠 Model Details

Model Type:

- Convolutional Neural Network (CNN)

Classification Classes:

- Real ₹500
- Fake ₹500
- Real ₹2000
- Fake ₹2000

Framework:

- TensorFlow / Keras

---

## 📊 Dataset

The model was trained using images of Indian currency notes consisting of:

- Real ₹500 Notes
- Fake ₹500 Notes
- Real ₹2000 Notes
- Fake ₹2000 Notes

The dataset was augmented to improve the model's generalization performance.

---

## 📈 Workflow

1. Collect Dataset
2. Image Preprocessing
3. Data Augmentation
4. CNN Model Training
5. Model Evaluation
6. Save Trained Model
7. Build Flask Application
8. Integrate Gemini AI
9. Deploy Prediction System


## 📌 Future Improvements

- Support More Indian Currency Denominations
- Real-time Camera Detection
- Mobile Application
- Cloud Deployment
- Improved CNN Architecture
- Explainable AI (Grad-CAM)

---

## 🤝 Contributing

Contributions are welcome!

Feel free to fork the repository and submit a pull request.

---

## 👨‍💻 Author

**Ankith G J**

Computer Science Engineering Student

GitHub:
https://github.com/ankithgj31

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It helps the project reach more developers and motivates future improvements.

---

## 📄 License

This project is developed for educational and research purposes.
