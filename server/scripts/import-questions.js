import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.argv.includes('--production');
const envFile = isProduction ? '../../.env.production' : '../../.env';
dotenv.config({ path: path.join(__dirname, envFile) });
console.log(`Loaded environment from ${envFile}`);

const MONGO_URI = process.env.MONGO_URI;

// We redefine schemas to avoid any module resolution issues if the script is run standalone
const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    duration: { type: Number, min: 1 },
    totalMarks: { type: Number, min: 0 },
    passMarks: { type: Number, min: 0 },
    questionCount: { type: Number, min: 0, default: 0 },
    course: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: { type: Number, min: 0, max: 3, required: true },
  },
  { timestamps: true }
);

const Exam = mongoose.models.Exam || mongoose.model("Exam", examSchema);
const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

async function importQuestions() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Find an admin user to be the creator
    const db = mongoose.connection.db;
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    
    let createdBy;
    if (adminUser) {
      createdBy = adminUser._id;
    } else {
      // If no admin, just pick any user
      const anyUser = await db.collection('users').findOne({});
      if (anyUser) {
        createdBy = anyUser._id;
      } else {
        // Fallback dummy ObjectId if no users exist
        createdBy = new mongoose.Types.ObjectId();
        console.warn("No users found in database. Using a dummy ObjectId for createdBy.");
      }
    }

    // Parse the markdown file
    const filePath = path.join(__dirname, '../../Data_Analyst_Question_Bank_Full.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // Updated regex to be more flexible with formatting
    const regex = /(?:##\s*)?\d+\.\s*(.*?)\n+(?:[-]?\s*A\.\s*(.*?)\n+)?(?:[-]?\s*B\.\s*(.*?)\n+)?(?:[-]?\s*C\.\s*(.*?)\n+)?(?:[-]?\s*D\.\s*(.*?)\n+)?(?:##\s*)?Correct Answer:\s*([A-D])/gis;

    let match;
    let questionsData = [];

    while ((match = regex.exec(content)) !== null) {
      const qText = match[1]?.trim();
      const optA = match[2]?.trim() || "Option A";
      const optB = match[3]?.trim() || "Option B";
      const optC = match[4]?.trim() || "Option C";
      const optD = match[5]?.trim() || "Option D";
      const ansChar = match[6]?.toUpperCase();

      if (!qText || !ansChar) continue;

      let ansIndex = 0;
      if (ansChar === 'B') ansIndex = 1;
      else if (ansChar === 'C') ansIndex = 2;
      else if (ansChar === 'D') ansIndex = 3;

      questionsData.push({
        question: qText,
        options: [optA, optB, optC, optD],
        correctAnswer: ansIndex
      });
    }

    console.log(`Parsed ${questionsData.length} questions from the markdown file.`);

    if (questionsData.length === 0) {
      console.log("No questions found to import.");
      process.exit(0);
    }

    // Create the Exam
    const exam = new Exam({
      title: "Data Analytics – Final Certification Assessment",
      duration: 90,
      totalMarks: 100,
      passMarks: 40,
      questionCount: 50,
      course: "Data Analytics",
      createdBy: createdBy
    });

    await exam.save();
    console.log(`Created Exam: ${exam.title} (ID: ${exam._id})`);

    // Prepare Questions for Insert
    const questionsToInsert = questionsData.map(q => ({
      ...q,
      examId: exam._id
    }));

    await Question.insertMany(questionsToInsert);
    console.log(`Successfully injected ${questionsToInsert.length} questions into the database.`);

  } catch (error) {
    console.error("Error during import:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

importQuestions();
