// Defines the structure for a single prompt sent to the LLM
export type PromptType = {
  prompt_text: string;
  temperature?: number;
  model?: string;
  // Memory flags remain for potential future use
  important_memory?: boolean;
  buffer_memory?: number;
  saveUserInputAs?: string;
  saveAssistantOutputAs?: string;
};

// --- Prompt Sets for Different Topics ---

const hometownPrompts: PromptType[] = [
  // Turn 0: Intro
  {
    prompt_text: `# System
You are the examiner. Ask the candidate **one** question only.

## Task
Ask: **"Are you ready to begin Speaking Part 1?"**

## Rules
– Output must match exactly.
– Do not add anything else.`,
    temperature: 0, model: "gpt-4o-mini"
  },
  // Turn 1: Transition to topic
  {
    prompt_text: `# System
You are the examiner. Respond briefly and transition to the topic of 'hometown'.

## Task
Say: **"Great. Let's talk about your hometown. Ready?"**

## Rules
– Output must match exactly.
– No extra content.`,
    temperature: 0, model: "gpt-4o-mini"
  },
   // Turn 2: First question
  {
    prompt_text: `# System
You are the examiner. Ask the candidate **one** question about their hometown.

## Task
Ask: **"Where is your hometown?"**

## Rules
– Exact wording.
– No follow‑ups.`,
    temperature: 0, model: "gpt-4o-mini"
  },
  // Turn 3: Follow-up 1
  {
    prompt_text: `# System
You are the examiner. Ask **one** follow-up question about their hometown based on the context.

## Task
Ask: **"What do you like most about living there?"**

## Rules
– Exact wording.
– Do not add anything else.`,
    temperature: 0, model: "gpt-4o-mini"
  },
  // Turn 4: Follow-up 2
  {
    prompt_text: `# System
You are the examiner. Ask **one** follow-up question about their hometown based on the context.

## Task
Ask: **"How has your hometown changed in recent years?"**

## Rules
– Exact wording.
– No extra content.`,
    temperature: 0, model: "gpt-4o-mini"
  },
  // Turn 5: Follow-up 3
  {
    prompt_text: `# System
You are the examiner. Ask **one** final follow-up question about their hometown.

## Task
Ask: **"Would you recommend your hometown to visitors? Why or why not?"**

## Rules
– Exact wording.
– Do not add anything else.`,
    temperature: 0, model: "gpt-4o-mini", important_memory: true
  },
  {
    prompt_text: `# System\nYou are the examiner. The test is now complete.\n\n## Task\nSay: **"Thank you for participating in the test. Your scores will be printed out in the console. Have a great day!"**\n\n## Rules\n– Output must match exactly.\n– Do not add anything else.`,
    temperature: 0, model: "gpt-4o-mini"
  }
  // Note: 6 turns total (0-5). Feedback happens after turn 5's audio ends.
];

const computerPrompts: PromptType[] = [
  // Turn 0: Intro
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"Are you ready to begin Speaking Part 1?"**
## Rules
– Output must match exactly...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 1: Transition
  { prompt_text: `# System
You are the examiner...
## Task
Say: **"Okay. Let's talk about computers. Ready?"**
## Rules
– Output must match exactly...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 2: First question
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"How often do you use a computer?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 3: Follow-up 1
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"What do you mainly use a computer for?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 4: Follow-up 2
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"Do you think computers have changed society significantly?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 5: Follow-up 3
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"Are there any disadvantages to relying heavily on computers?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini", important_memory: true },
  {
    prompt_text: `# System\nYou are the examiner. The test is now complete.\n\n## Task\nSay: **"Thank you for participating in the test. Your scores will be printed out in the console. Have a great day!"**\n\n## Rules\n– Output must match exactly.\n– Do not add anything else.`,
    temperature: 0, model: "gpt-4o-mini"
  }
];

const freeTimePrompts: PromptType[] = [
   // Turn 0: Intro
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"Are you ready to begin Speaking Part 1?"**
## Rules
– Output must match exactly...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 1: Transition
  { prompt_text: `# System
You are the examiner...
## Task
Say: **"Right. Now I'd like to ask you about how you spend your free time. Ready?"**
## Rules
– Output must match exactly...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 2: First question
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"What do you usually do in your free time?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 3: Follow-up 1
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"Do you prefer spending your free time alone or with others?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 4: Follow-up 2
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"Has the way you spend your free time changed over the years?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini" },
  // Turn 5: Follow-up 3
  { prompt_text: `# System
You are the examiner...
## Task
Ask: **"How important is it to have hobbies or leisure activities?"**
## Rules
– Exact wording...`, temperature: 0, model: "gpt-4o-mini", important_memory: true },
  {
    prompt_text: `# System\nYou are the examiner. The test is now complete.\n\n## Task\nSay: **"Thank you for participating in the test. Your scores will be printed out in the console. Have a great day!"**\n\n## Rules\n– Output must match exactly.\n– Do not add anything else.`,
    temperature: 0, model: "gpt-4o-mini"
  }
];

// --- Main Export --- 

// Structure containing all topic sets
export const TOPIC_PROMPT_SETS: Record<string, PromptType[]> = {
  "Hometown": hometownPrompts,
  "Computers": computerPrompts,
  "Free Time": freeTimePrompts,
};

// Function to get the names of available topics
export const getAvailableTopics = (): string[] => {
  return Object.keys(TOPIC_PROMPT_SETS);
}; 