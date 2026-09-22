import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.argv.includes('--production');
const isApply = process.argv.includes('--apply');

const envFile = isProduction ? '../../.env.production' : '../../.env';
dotenv.config({ path: path.join(__dirname, envFile) });

console.log(`\n==============================================`);
console.log(`MODE: ${isProduction ? 'PRODUCTION' : 'LOCAL / DEVELOPMENT'}`);
console.log(`ACTION: ${isApply ? 'APPLY (WILL DELETE DUPLICATES)' : 'DRY RUN (READ ONLY PREVIEW)'}`);
console.log(`ENV FILE: ${envFile}`);
console.log(`==============================================\n`);

function normalizeQuestionText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/^(##\s*)?\d+[\.\)]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreQuestionQuality(q) {
  if (!q || !Array.isArray(q.options)) return 0;
  let score = 10;
  const hasDummy = q.options.some((opt) => typeof opt === 'string' && /^Option [A-D]$/i.test(opt.trim()));
  if (hasDummy) score -= 5;
  if (/[A-D]\.\s+[A-Za-z0-9]/.test(q.question)) score -= 2;
  return score;
}

async function runDeduplication() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI is not defined in environment!');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB (${isProduction ? 'Production Config' : 'Local Config'})...`);
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected successfully.\n');

    const db = mongoose.connection.db;
    const exams = await db.collection('exams').find().toArray();
    console.log(`Found ${exams.length} exam(s) in database.\n`);

    let totalDeleted = 0;
    let totalRetained = 0;

    for (const exam of exams) {
      console.log(`--------------------------------------------------`);
      console.log(`Exam: "${exam.title}" (ID: ${exam._id})`);
      console.log(`Current questionCount setting: ${exam.questionCount}`);

      const questions = await db.collection('questions').find({ examId: exam._id }).toArray();
      console.log(`Total questions currently in DB for this exam: ${questions.length}`);

      if (questions.length === 0) {
        console.log('No questions found for this exam.\n');
        continue;
      }

      // Group by normalized text
      const groups = new Map();
      for (const q of questions) {
        const key = normalizeQuestionText(q.question);
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(q);
      }

      console.log(`Total UNIQUE question texts: ${groups.size}`);
      const duplicateGroups = Array.from(groups.entries()).filter(([k, list]) => list.length > 1);
      console.log(`Questions that have duplicate rows: ${duplicateGroups.length}`);

      const idsToDelete = [];
      const idsToKeep = [];

      for (const [text, list] of groups.entries()) {
        // Sort list so highest quality question is first
        list.sort((a, b) => scoreQuestionQuality(b) - scoreQuestionQuality(a));
        const keep = list[0];
        const duplicates = list.slice(1);

        idsToKeep.push(keep._id);
        duplicates.forEach((d) => idsToDelete.push(d._id));
      }

      console.log(`Unique questions to KEEP: ${idsToKeep.length}`);
      console.log(`Duplicate copies to REMOVE: ${idsToDelete.length}`);

      console.log('\nSample duplicates breakdown:');
      duplicateGroups.slice(0, 5).forEach(([text, list], idx) => {
        console.log(`  ${idx + 1}. "${text.slice(0, 60)}..." (Count: ${list.length} copies)`);
      });

      if (isApply) {
        if (idsToDelete.length > 0) {
          const deleteResult = await db.collection('questions').deleteMany({
            _id: { $in: idsToDelete }
          });
          console.log(`\n>>> Successfully DELETED ${deleteResult.deletedCount} duplicate question rows.`);
          totalDeleted += deleteResult.deletedCount;
        }

        // Adjust exam questionCount if it exceeds unique questions available
        const newCount = idsToKeep.length;
        if (exam.questionCount && exam.questionCount > newCount) {
          await db.collection('exams').updateOne(
            { _id: exam._id },
            { $set: { questionCount: newCount } }
          );
          console.log(`>>> Updated exam questionCount from ${exam.questionCount} to ${newCount}`);
        }
      } else {
        console.log(`\n[DRY RUN] No changes were made. Run with --apply to execute the cleanup.`);
      }

      totalRetained += idsToKeep.length;
      console.log(`--------------------------------------------------\n`);
    }

    console.log(`Summary:`);
    console.log(`- Total Unique Questions Retained: ${totalRetained}`);
    console.log(`- Total Duplicate Rows ${isApply ? 'Deleted' : 'Identified for Deletion'}: ${isApply ? totalDeleted : 'See above'}`);

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    process.exit(0);
  }
}

runDeduplication();
