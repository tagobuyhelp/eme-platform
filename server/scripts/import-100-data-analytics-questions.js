import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.argv.includes('--production');

// Allow passing mongo URI directly via CLI flag: --uri="mongodb://..."
const cliUriArg = process.argv.find(arg => arg.startsWith('--uri='));
const cliUri = cliUriArg ? cliUriArg.split('=').slice(1).join('=') : null;

// Smart env resolution
const candidateEnvPaths = [
  isProduction ? path.resolve(__dirname, '../../.env.production') : null,
  isProduction ? path.resolve(process.cwd(), '.env.production') : null,
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'server/.env'),
].filter(Boolean);

let loadedEnvPath = null;
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
    if (process.env.MONGO_URI || process.env.MONGODB_URI) {
      loadedEnvPath = envPath;
      break;
    }
  }
}

console.log(`\n==============================================`);
console.log(`IMPORTING 100 NEW DATA ANALYTICS QUESTIONS`);
console.log(`SOURCE: EME Data Analytics MCQ Test Questions Final`);
console.log(`TARGET: ${isProduction ? 'PRODUCTION DATABASE' : 'DATABASE'}`);
console.log(`ENV FILE LOADED: ${loadedEnvPath || (cliUri ? 'Provided via --uri CLI flag' : 'None detected')}`);
console.log(`==============================================\n`);

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

async function import100Questions() {
  const uri = cliUri || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("\n[ERROR] MONGO_URI is not defined!");
    console.error("Checked configuration locations:");
    candidateEnvPaths.forEach(p => console.error(`  - ${p} -> [${fs.existsSync(p) ? 'FILE EXISTS' : 'FILE NOT FOUND'}]`));
    console.error("\nTip: You can also pass the MongoDB URI directly via CLI flag:");
    console.error('  node server/scripts/import-100-data-analytics-questions.js --uri="mongodb://localhost:27017/eme-platform"\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully.");

    // Load questions from JSON or Markdown
    const jsonPath = path.join(__dirname, 'questions-100.json');
    let questionsData = [];

    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      questionsData = JSON.parse(raw);
      console.log(`Loaded ${questionsData.length} questions from questions-100.json`);
    } else {
      const mdPath = path.join(__dirname, '../../Data_Analyst_Question_Bank_Full.md');
      const content = fs.readFileSync(mdPath, 'utf8');
      const regex = /(?:###?\s*)?(\d+)\.\s*(.*?)\n+[-]\s*A\.\s*(.*?)\n+[-]\s*B\.\s*(.*?)\n+[-]\s*C\.\s*(.*?)\n+[-]\s*D\.\s*(.*?)\n+Correct Answer:\s*([A-D])/gis;

      let match;
      while ((match = regex.exec(content)) !== null) {
        const num = parseInt(match[1]);
        const qText = match[2]?.trim();
        const optA = match[3]?.trim();
        const optB = match[4]?.trim();
        const optC = match[5]?.trim();
        const optD = match[6]?.trim();
        const ansChar = match[7]?.toUpperCase();

        let ansIndex = 0;
        if (ansChar === 'B') ansIndex = 1;
        else if (ansChar === 'C') ansIndex = 2;
        else if (ansChar === 'D') ansIndex = 3;

        questionsData.push({
          num,
          question: qText,
          options: [optA, optB, optC, optD],
          correctAnswer: ansIndex,
          answerLetter: ansChar,
        });
      }
      console.log(`Parsed ${questionsData.length} questions from markdown file.`);
    }

    if (questionsData.length !== 100) {
      console.warn(`WARNING: Expected 100 questions, but found ${questionsData.length}!`);
    }

    // 1. Locate the Exam
    let exam = await Exam.findOne({
      $or: [
        { title: "Data Analytics – Final Certification Assessment" },
        { title: "EME Academy Test - Data Analysis" },
        { course: "Data Analytics" }
      ]
    });

    if (!exam) {
      const db = mongoose.connection.db;
      const adminUser = await db.collection('users').findOne({ role: 'admin' });
      const createdBy = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

      exam = new Exam({
        title: "Data Analytics – Final Certification Assessment",
        duration: 90, // 1.30 Hours
        totalMarks: 100,
        passMarks: 40,
        questionCount: questionsData.length,
        course: "Data Analytics",
        createdBy: createdBy,
      });
      await exam.save();
      console.log(`Created new Exam: "${exam.title}" (ID: ${exam._id})`);
    } else {
      exam.questionCount = questionsData.length;
      exam.duration = 90; // 1.30 Hours as specified in docx
      exam.totalMarks = 100;
      exam.passMarks = 40;
      exam.course = "Data Analytics";
      await exam.save();
      console.log(`Found existing Exam: "${exam.title}" (ID: ${exam._id}). Updated settings: duration=90m, totalMarks=100, questionCount=${questionsData.length}.`);
    }

    // 2. Clear ALL existing questions for this exam
    const deleteResult = await Question.deleteMany({ examId: exam._id });
    console.log(`Successfully removed all ${deleteResult.deletedCount} old questions from exam.`);

    // 3. Insert the 100 new questions
    const questionsToInsert = questionsData.map((q) => ({
      examId: exam._id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    const inserted = await Question.insertMany(questionsToInsert);
    console.log(`\n==============================================`);
    console.log(`SUCCESS: Imported ${inserted.length} brand new unique questions!`);
    console.log(`Exam Title: "${exam.title}"`);
    console.log(`Associated Course: "${exam.course}"`);
    console.log(`Duration: 90 Minutes (1.30 Hours)`);
    console.log(`Total Marks: 100`);
    console.log(`Pass Marks: 40`);
    console.log(`Question Count: ${inserted.length}`);
    console.log(`==============================================\n`);

    console.log("Sections Breakdown:");
    console.log(`- Questions 1 - 20   : Section 1: Excel (20 questions)`);
    console.log(`- Questions 21 - 40  : Section 2: SQL (20 questions)`);
    console.log(`- Questions 41 - 60  : Section 3: Power BI (20 questions)`);
    console.log(`- Questions 61 - 80  : Section 4: Python (20 questions)`);
    console.log(`- Questions 81 - 100 : Section 5: Basic Statistics (20 questions)\n`);

  } catch (err) {
    console.error("Error during import:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

import100Questions();
