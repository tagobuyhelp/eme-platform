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

// Smart env resolution: check .env.production first if flag passed, then fallback to .env in root and subdirectories
const candidateEnvPaths = [
  isProduction ? path.resolve(__dirname, '../../.env.production') : null,
  isProduction ? path.resolve(process.cwd(), '.env.production') : null,
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'server/.env'),
].filter(Boolean);

let loadedEnvPath = null;

// 1. Try to load candidate env files
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
console.log(`IMPORTING 20 UNIQUE QUESTIONS`);
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

async function import20UniqueQuestions() {
  const uri = cliUri || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("\n[ERROR] MONGO_URI is not defined!");
    console.error("Checked configuration locations:");
    candidateEnvPaths.forEach(p => console.error(`  - ${p} -> [${fs.existsSync(p) ? 'FILE EXISTS' : 'FILE NOT FOUND'}]`));
    console.error("\nTip: You can also pass the MongoDB URI directly via CLI flag:");
    console.error('  node server/scripts/import-20-unique-questions.js --uri="mongodb://localhost:27017/eme-platform"\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully.");

    // Parse the 20 questions markdown file
    const mdPath = path.join(__dirname, '../../Data_Analyst_Question_Bank_Full.md');
    const content = fs.readFileSync(mdPath, 'utf8');

    const regex = /(?:##\s*)?(\d+)\.\s*(.*?)\n+[-]\s*A\.\s*(.*?)\n+[-]\s*B\.\s*(.*?)\n+[-]\s*C\.\s*(.*?)\n+[-]\s*D\.\s*(.*?)\n+Correct Answer:\s*([A-D])/gis;

    let match;
    const questionsData = [];

    while ((match = regex.exec(content)) !== null) {
      const num = match[1];
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
      });
    }

    console.log(`Successfully parsed ${questionsData.length} unique questions from markdown.\n`);

    if (questionsData.length === 0) {
      console.error("ERROR: No questions could be parsed from markdown file!");
      process.exit(1);
    }

    // Find or create the exam
    let exam = await Exam.findOne({ title: "Data Analytics – Final Certification Assessment" });

    if (!exam) {
      const db = mongoose.connection.db;
      const adminUser = await db.collection('users').findOne({ role: 'admin' });
      const createdBy = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

      exam = new Exam({
        title: "Data Analytics – Final Certification Assessment",
        duration: 90,
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
      exam.duration = exam.duration || 90;
      exam.totalMarks = exam.totalMarks || 100;
      exam.passMarks = exam.passMarks || 40;
      exam.course = "Data Analytics";
      await exam.save();
      console.log(`Found existing Exam: "${exam.title}" (ID: ${exam._id}). Updated questionCount to ${questionsData.length}.`);
    }

    // Clear old questions for this exam
    const deleteResult = await Question.deleteMany({ examId: exam._id });
    console.log(`Cleared ${deleteResult.deletedCount} old questions from this exam.`);

    // Insert 20 pristine unique questions
    const questionsToInsert = questionsData.map((q) => ({
      examId: exam._id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    const inserted = await Question.insertMany(questionsToInsert);
    console.log(`\nSuccessfully imported ${inserted.length} clean unique questions into the database!\n`);

    console.log(`--------------------------------------------------`);
    console.log(`Imported Questions Summary:`);
    inserted.forEach((q, idx) => {
      const letters = ['A', 'B', 'C', 'D'];
      console.log(`Q${idx + 1}: ${q.question}`);
      console.log(`    Options: [A: ${q.options[0]} | B: ${q.options[1]} | C: ${q.options[2]} | D: ${q.options[3]}]`);
      console.log(`    Correct Answer: ${letters[q.correctAnswer]} (${q.options[q.correctAnswer]})\n`);
    });
    console.log(`--------------------------------------------------`);

  } catch (err) {
    console.error("Error during import:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

import20UniqueQuestions();
