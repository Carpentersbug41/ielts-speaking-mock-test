export type PromptType = {
  criterion: string;
  prompt_template: string;
  model?: string;
};

export const RUBRIC_PROMPTS: PromptType[] = [
  {
    criterion: "DAP Note",
    prompt_template: `You are a highly efficient AI assistant for a licensed psychotherapist. Your task is to draft a clinical note in the DAP (Data, Assessment, Plan) format based on the provided session transcript. The note should be clear, concise, and professional.

### INSTRUCTIONS ###
1.  **Data (D):** Summarize the key subjective and objective information from the session. 
    -   Include the client's primary complaints and stated goals.
    -   Mention key events or topics discussed.
    -   Include at least one significant direct quote from the client that captures their emotional state or core issue.
2.  **Assessment (A):** Synthesize the data to provide a clinical impression of the client's state *during this session*.
    -   Describe the client's mood, affect, and presentation as evidenced in the transcript.
    -   Identify the major themes and emotional patterns that emerged.
    -   **CRITICAL SAFETY RULE: Do not, under any circumstances, provide a formal diagnosis (e.g., "Major Depressive Disorder").** Instead, describe the client's symptoms and struggles in clinical terms (e.g., "The client presents with symptoms consistent with low mood and anhedonia.").
3.  **Plan (P):** Outline the plan for future sessions based on the transcript.
    -   State the interventions used by the therapist during the session (e.g., "Therapist used reflective listening and Socratic questioning...").
    -   List any homework or strategies the client agreed to work on.
    -   Suggest a focus for the next session based on the unresolved topics.

### OUTPUT FORMAT ###
Provide the output in Markdown format with clear headings.

### Data
-   **Client Presentation:** [Summarize the client's reason for the visit and overall presentation.]
-   **Key Topics Discussed:** [Bulleted list of main topics.]
-   **Significant Quote:** "[Insert direct client quote here.]"

### Assessment
-   **Clinical Impression:** [Your assessment of the client's state during the session, following the safety rule.]
-   **Key Themes:** [Bulleted list of emotional or cognitive themes.]

### Plan
-   **Interventions Used:** [Describe therapist's actions.]
-   **Client Homework/Strategy:** [State any agreed-upon tasks.]
-   **Focus for Next Session:** [Suggest a direction for the next meeting.]

Transcript:
{{TRANSCRIPT}}
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

  // Accept both 'Band Score:' and 'Band score:' (case-insensitive)
  const scoreMatch = output.match(/Band [Ss]core:\s*([1-9])/);
  // Try to match 'Feedback:' label, but if not found, take everything after the score
  let feedbackMatch = output.match(/Feedback:\s*(.*)/);
  let feedback = '';
  if (feedbackMatch) {
    feedback = feedbackMatch[1].trim();
  } else {
    // If no 'Feedback:' label, try to extract everything after the band score
    const afterScore = output.split(/Band [Ss]core:\s*[1-9]/i)[1];
    if (afterScore) {
      feedback = afterScore.trim();
    }
  }

  if (scoreMatch && feedback) {
    const band_score = parseInt(scoreMatch[1], 10);
    if (!isNaN(band_score) && feedback) {
      return { band_score, feedback };
    }
  }
  console.error("Failed to parse rubric output:", output);
  return null; // Return null if parsing fails
} 