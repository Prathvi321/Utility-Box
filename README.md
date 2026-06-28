# 🧰 Utility-Box

A comprehensive, all-in-one suite of web-based utilities designed to streamline your daily tasks. Built with modern web technologies, Utility-Box offers a fast, beautiful, and intuitive interface for common file and data operations without needing to install specialized desktop software.

All pages are optimized to fit on a single viewport for desktop users, preventing vertical scrolling on 1080p monitors.

## ✨ Features

Utility-Box provides an ever-growing collection of free, client-side tools:

- 📄 **PDF Tools**: Merge multiple PDFs, convert PDF to images, or combine images into a single PDF.
- 🖼️ **Image Tools**: Compress images without quality loss, convert between formats (JPG/PNG/WebP), remove backgrounds using AI, pick colors, and add custom watermarks.
- 🔗 **Generators**: Instantly generate QR codes, create custom WhatsApp chat links with pre-filled messages and country code selectors, and draft professional GST invoices.
- 📹 **Video Tools**: **FrameSnap** - extract high-quality still frames from any video.
- 🗣️ **Text-to-Speech**: Convert your text into playable and downloadable audio.
- 🗄️ **Database Converter**: Seamlessly convert SQL `INSERT` statements to JSON arrays and vice-versa.

All processing is done **locally in your browser** for maximum privacy and speed!

---

## 🔍 Smart AI Search Workflow

Utility-Box features a **Gemini 2.5 Flash-powered Smart Search** system that lets users describe their goals in plain natural language (e.g. *"I want to merge some images and convert them into a single file"*) to locate corresponding tools.

### How it Works (User Workflow)
1. **Real-time Keyword Search**: As the user types in the search bar, the homepage immediately filters tools based on title, description, and keyword matches in real time.
2. **AI Trigger**: If standard search yields no results or the user wants intelligent recommendations, they can click the **AI Search** button next to the input field (or press **Enter**).
3. **Gemini Query Analysis**: The app sends the query to a local Netlify function endpoint which formats a catalog prompt for Gemini 2.5 Flash.
4. **Intelligent Routing**: Gemini returns a structured JSON list of the tool IDs matching the request. The UI dynamically isolates and displays only these tools.
5. **Availability Fallback**: If the requested task is not supported by our current toolset, the page displays a custom message: *"Service not available on our platform"*.
6. **Typing Reset**: As soon as the user starts typing a new query, the search immediately switches back to standard real-time keyword matching for maximum responsiveness.

---

## 🚀 Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router
- **Animation**: Framer Motion
- **AI integration**: Google Gemini 2.5 Flash API (via Serverless Netlify functions)

---

## 📦 Local Installation & Setup

To run this project locally with working API functions, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Utility-Box.git
   cd Utility-Box
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the project to add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   REMOVE_BG_API_KEY=your_removebg_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:5173` (or port `5174`).
   
   *Note: Our custom Vite Dev Server router middleware automatically intercepts requests to `/.netlify/functions/*` and runs the ES-module handlers locally, feeding the `.env` variables. You do not need to install or run Netlify CLI to test AI Search, tts, or background removal locally!*

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🤝 Contributing

Utility-Box is open-source! Contributions are highly encouraged. Feel free to open an Issue or Pull Request.

## 📄 License

This project is free and open-source software distributed under the MIT License.
