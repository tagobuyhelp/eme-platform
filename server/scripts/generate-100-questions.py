import zipfile
import xml.etree.ElementTree as ET
import re
import json

docx_path = r'g:\Development\eme-platform\uploads\EME Data Analytics MCQ Test Questions Final.docx'
with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    paragraphs = []
    for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
        if texts:
            paragraphs.append(''.join(texts).strip())

ans_start_idx = None
for i, l in enumerate(paragraphs):
    if 'Answer Keys:' in l:
        ans_start_idx = i
        break

ans_lines = paragraphs[ans_start_idx:]
answer_keys = []
for l in ans_lines:
    m = re.match(r'^([A-D])\)\s*(.*)', l)
    if m:
        answer_keys.append((m.group(1), m.group(2).strip()))

content_lines = paragraphs[:ans_start_idx]

q_pattern = re.compile(r'^(\d+)\.\s*(.*)')
opt_pattern = re.compile(r'^([A-D])\)\s*(.*)')

parsed_questions = []
current_q = None

for idx, line in enumerate(content_lines):
    if line.startswith('2. Which clause is used in a SQL query to filter records'):
        line = '38. Which clause is used in a SQL query to filter records' + line[len('2. Which clause is used in a SQL query to filter records'):]

    m_q = q_pattern.match(line)
    if m_q:
        q_num = int(m_q.group(1))
        current_q = {
            'num': q_num,
            'question': m_q.group(2).strip(),
            'options': [],
        }
        parsed_questions.append(current_q)
        continue

    m_opt = opt_pattern.match(line)
    if m_opt and current_q:
        current_q['options'].append((m_opt.group(1), m_opt.group(2).strip()))
        continue

    if current_q and not line.startswith('Section') and not line.startswith('Marks:') and not line.startswith('EME Academy') and not line.startswith('(Data Analysis)'):
        if len(current_q['options']) == 0:
            current_q['question'] += ' ' + line.strip()
        elif len(current_q['options']) > 0:
            last_opt_letter, last_opt_text = current_q['options'][-1]
            current_q['options'][-1] = (last_opt_letter, last_opt_text + ' ' + line.strip())

letter_to_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}

final_questions = []
for i in range(100):
    q = parsed_questions[i]
    ans_letter, ans_text = answer_keys[i]
    opt_list = [opt[1] for opt in q['options']]
    final_questions.append({
        'num': q['num'],
        'question': q['question'],
        'options': opt_list,
        'correctAnswer': letter_to_idx[ans_letter],
        'answerLetter': ans_letter,
        'answerText': ans_text
    })

# Save to JSON
with open(r'g:\Development\eme-platform\server\scripts\questions-100.json', 'w', encoding='utf-8') as f:
    json.dump(final_questions, f, indent=2, ensure_ascii=False)

# Save to Markdown
with open(r'g:\Development\eme-platform\Data_Analyst_Question_Bank_Full.md', 'w', encoding='utf-8') as f:
    f.write("# EME Academy Test\n## (Data Analysis)\n\n**Marks: 100 | Time: 1.30 Hours (90 Minutes)**\n\n")
    sections = [
        (1, 20, "Section 1: Excel (Questions 1 – 20)"),
        (21, 40, "Section 2: SQL (Questions 21 – 40)"),
        (41, 60, "Section 3: Power BI (Questions 41 – 60)"),
        (61, 80, "Section 4: Python (Questions 61 – 80)"),
        (81, 100, "Section 5: Basic Statistics (Questions 81 – 100)")
    ]
    for start, end, sec_title in sections:
        f.write(f"\n## {sec_title}\n\n")
        for q in final_questions[start-1:end]:
            f.write(f"### {q['num']}. {q['question']}\n")
            f.write(f"- A. {q['options'][0]}\n")
            f.write(f"- B. {q['options'][1]}\n")
            f.write(f"- C. {q['options'][2]}\n")
            f.write(f"- D. {q['options'][3]}\n")
            f.write(f"Correct Answer: {q['answerLetter']}\n\n")

print("Generated questions-100.json and updated Data_Analyst_Question_Bank_Full.md with 100 questions!")
