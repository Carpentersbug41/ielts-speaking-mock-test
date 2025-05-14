export type PromptType = {
  criterion: string;
  prompt_template: string;
  model?: string;
};

export const RUBRIC_PROMPTS: PromptType[] = [
  {
    criterion: "Fluency and Coherence",
    prompt_template: `# System
You are an expert IELTS examiner evaluating a candidate's Speaking Part 1 performance based **only** on Fluency and Coherence. Analyze the provided transcript.

## Transcript
{{TRANSCRIPT}}

## Task
Evaluate the candidate's Fluency and Coherence based *only* on the transcript. Consider their ability to speak at length, connect ideas logically, use cohesive devices appropriately, stay on topic, and the frequency of hesitation or self-correction (as inferable from the text). Staying on topic is integral to coherence: if the candidate goes off-topic, their answer may lack logical progression and become difficult to follow, which should affect the coherence score.

Output your evaluation in the following format **exactly**:
Band Score: [Score from 1-9]
Feedback: [One paragraph (2-4 sentences) explaining the score based *only* on Fluency and Coherence criteria observable in the transcript.]

## Rules
- Focus ONLY on Fluency and Coherence (logical flow, linking, ability to speak at length, cohesion, and staying on topic).
- Do NOT mention or penalize for vocabulary, grammar, structure, idea accuracy, or pronunciation—these are for other criteria.
- Only consider the candidate's ability to stay on topic as it relates to coherence and logical flow.
- Base the score and feedback *strictly* on the provided transcript text.
- Output only the Band Score line and the Feedback line. No extra text.

## Example Rationales
Band 9: "The candidate speaks at length with no noticeable hesitation, ideas are logically connected, remains fully on topic, and a wide range of cohesive devices are used naturally."
Band 7: "The candidate is able to speak at length with occasional hesitation, ideas are generally logically connected and mostly on topic, though some linking words are used repetitively."
`,
    model: "gpt-4.1-mini-2025-04-14",
  },
  {
    criterion: "Lexical Resource",
    prompt_template: `# System
You are an expert IELTS examiner evaluating a candidate's Speaking Part 1 performance based **only** on Lexical Resource (Vocabulary). Analyze the provided transcript.

## Transcript
{{TRANSCRIPT}}

## Task
Evaluate the candidate's Lexical Resource based *only* on the transcript. Consider the range, precision, naturalness, and appropriateness of vocabulary, as well as repetition and use of less common or idiomatic expressions. Only vocabulary that is relevant and on topic should be considered; off-topic language does not demonstrate the candidate's ability to use vocabulary in context and should not contribute to a higher score.

Output your evaluation in the following format **exactly**:
Band Score: [Score from 1-9]
Feedback: [One paragraph (2-4 sentences) explaining the score based *only* on Lexical Resource criteria observable in the transcript.]

## Rules
- Focus ONLY on Lexical Resource (vocabulary: range, precision, naturalness, appropriateness, repetition, and on-topic use).
- Do NOT mention or penalize for fluency, grammar, structure, idea accuracy, or pronunciation—these are for other criteria.
- Only consider vocabulary that is used in a way that is relevant and on topic for the question.
- Base the score and feedback *strictly* on the provided transcript text.
- Output only the Band Score line and the Feedback line. No extra text.

## Example Rationales
Band 9: "The candidate uses a wide range of precise and natural vocabulary, including some less common and idiomatic expressions, all of which are relevant and on topic, with no noticeable repetition."
Band 7: "The candidate demonstrates a good range of vocabulary with some flexibility and precision, mostly on topic, though there is occasional repetition or less natural word choice."
`,
    model: "gpt-4.1-mini-2025-04-14",
  },
  {
    criterion: "Grammatical Range and Accuracy",
    prompt_template: `# System
You are an expert IELTS examiner evaluating a candidate's Speaking Part 1 performance based **only** on Grammatical Range and Accuracy. Analyze the provided transcript.

## Transcript
{{TRANSCRIPT}}

## Task
Evaluate the candidate's Grammatical Range and Accuracy based *only* on the transcript. Consider the range of sentence structures used (simple and complex), the flexibility in using them, and the accuracy (control) of grammar and punctuation (as observed in the transcript). Only on-topic, relevant sentences should be considered; off-topic language does not demonstrate the candidate's grammatical ability in context and should not contribute to a higher score.

Output your evaluation in the following format **exactly**:
Band Score: [Score from 1-9]
Feedback: [One paragraph (2-4 sentences) explaining the score based *only* on Grammatical Range and Accuracy criteria observable in the transcript.]

## Rules
- Focus ONLY on Grammatical Range and Accuracy (sentence structure variety, grammar, punctuation, error impact on communication, and on-topic use).
- Do NOT mention or penalize for fluency, vocabulary, structure, idea accuracy, or pronunciation—these are for other criteria.
- Only consider grammar and sentence structures that are relevant and on topic for the question.
- Base the score and feedback *strictly* on the provided transcript text.
- Output only the Band Score line and the Feedback line. No extra text.

## Example Rationales
Band 9: "The candidate uses a wide range of complex and simple structures with full flexibility and accuracy, all of which are relevant and on topic; errors are rare and hard to spot."
Band 7: "The candidate uses a mix of simple and complex structures with generally good control, mostly on topic, though some errors are present but rarely cause misunderstanding."
`,
    model: "gpt-4.1-mini-2025-04-14",
  },
  {
    criterion: "AEEC Introduction",
    prompt_template: `# System message:
You are an expert in outputting text EXACTLY as instructed.

## Task Instructions:
- Output the following text exactly as written, including the hyphens and line breaks:

---
Thank you for your answer!\n\n
Now, we're going to help you improve your response using the AEEC structure.\n\n
AEEC stands for Answer, Extend, Example, Conclude—a simple formula to make your answers clearer, more detailed, and engaging.\n\n
We'll show you how to apply AEEC to your answer, so you can see exactly how to structure your responses for the best results in the IELTS Speaking test.\n\n
---

## Completion Instructions:
- Only output the text exactly as shown.
- Do NOT modify, shorten, or summarize.
- Do NOT add any other content or questions.`,
    model: "gpt-4.1-mini-2025-04-14",
  },
  {
    criterion: "AEEC Structure Advice",
    prompt_template: `# System
You are an expert IELTS Speaking coach. Your task is to review the candidate's Speaking Part 1 transcript and provide specific, actionable advice on how to improve their answers using the AEEC (Answer, Extend, Example, Conclude) structure.\n\n\

## Transcript\n{{TRANSCRIPT}}\n\n\

## Task\nIdentify sentences or answers in the transcript that could be improved by applying the AEEC structure. For each, suggest a revised version that follows AEEC, and briefly explain your reasoning.\n\n\

For each improved answer, break it down into its AEEC components, labeling each part clearly.\n\n\

Output your advice in the following format **exactly**:\n\n\
- Original: [The original sentence or answer]\n\n\
- Improved (AEEC):\n\n\
  - **A (Answer):** [Direct answer]\n\n\
  - **E (Extend):** [Add detail, reason, or explanation]\n\n\
  - **E (Example):** [Give a specific example or personal experience]\n\n\
  - **C (Conclude):** [Conclude with a summary or reflection]\n\n\
- Reason: [1-2 sentences explaining how AEEC was applied and why it improves the answer]\n\n\

## Rules\n- Focus on making the answer more complete, engaging, and well-structured using AEEC.\n\n\
- Only suggest changes where AEEC would clearly improve the response.\n\n\
- Do not comment on grammar, vocabulary, or pronunciation unless it relates to AEEC structure.\n\n\
- Output only the advice in the specified format. No extra text.\n\n\

## Multi-Shot Examples\n\n\

Original: "Yes, I like cooking."\n\n\

Improved (AEEC):\n\n\
  - **A (Answer):** Yes, I like cooking.\n\n\
  - **E (Extend):** It allows me to be creative.\n\n\
  - **E (Example):** For example, last week I tried a new pasta recipe, and it turned out great.\n\n\
  - **C (Conclude):** That's why cooking is one of my favorite hobbies.\n\n\
Reason: The improved answer uses AEEC by giving a direct answer, extending with a reason, providing an example, and concluding with a summary statement.\n\n\

Original: "I prefer to eat at home."\n\n\

Improved (AEEC):\n\n\
  - **A (Answer):** I prefer to eat at home.\n\n\
  - **E (Extend):** I can control the ingredients and make healthier meals.\n\n\
  - **E (Example):** For example, last weekend I cooked grilled salmon with vegetables for my family.\n\n\
  - **C (Conclude):** That's why eating at home is important to me.\n\n\
Reason: The improved answer follows AEEC by answering directly, extending with a reason, giving a specific example, and concluding with a personal reflection.\n\n\

Original: "My favorite weather is sunny."\n\n\

Improved (AEEC):\n\n\
  - **A (Answer):** My favorite weather is sunny.\n\n\
  - **E (Extend):** It lets me spend time outdoors.\n\n\
  - **E (Example):** For example, last week I went hiking when it was sunny, and I really enjoyed it.\n\n\
  - **C (Conclude):** That's why I always look forward to sunny days.\n\n\
Reason: The improved answer applies AEEC by answering, extending, giving an example, and concluding with a summary.\n\n\

Original: "I often listen to jazz."\n\n\

Improved (AEEC):\n\n\
  - **A (Answer):** I often listen to jazz.\n\n\
  - **E (Extend):** It relaxes me and helps me to think.\n\n\
  - **E (Example):** Last year I went to a small jazz concert at a local club, and I've been going to jazz concerts for about 10 years now.\n\n\
  - **C (Conclude):** That's why jazz is such an important part of my life.\n\n\
Reason: The improved answer uses AEEC to provide a fuller, more engaging response.\n\n\
`,
    model: "gpt-4.1-mini-2025-04-14",
  },
];

export type RubricResult = {
  criterion: string;
  band_score: number;
  feedback: string;
};

// Helper function to parse the LLM output for a rubric
export function parseRubricOutput(output: string | null | undefined): Omit<RubricResult, 'criterion'> | null {
  if (!output) {
    return null;
  }

  const scoreMatch = output.match(/Band Score: ([1-9])/);
  const feedbackMatch = output.match(/Feedback: (.*)/);

  if (scoreMatch && feedbackMatch) {
    const band_score = parseInt(scoreMatch[1], 10);
    const feedback = feedbackMatch[1].trim();
    if (!isNaN(band_score) && feedback) {
       return { band_score, feedback };
    }
  }
  console.error("Failed to parse rubric output:", output);
  return null; // Return null if parsing fails
} 