# IELTS Speaking Mock Test App - Cost Estimation

This document provides an estimate of the OpenAI API costs associated with using the application for one full mock interview session.

**Note:** These are estimates based on current OpenAI pricing for the specified models (as of the last update) and typical usage patterns. Actual costs may vary based on the exact length of user responses, potential variations in API usage, and future pricing changes by OpenAI.

## Models Used & Pricing

*   **Speech-to-Text (STT):** `gpt-4o-mini`
    *   *Pricing Assumption:* ~$0.003 / minute (Check current OpenAI pricing for accuracy)
*   **Question Generation (LLM):** `gpt-4o-mini`
    *   *Pricing Assumption:* Input: ~$0.15 / Million tokens, Output: ~$0.60 / Million tokens
*   **Text-to-Speech (TTS):** `gpt-4o-mini`
    *   *Pricing Assumption:* ~$0.015 / 1,000 characters
*   **Rubric Grading (LLM):** `gpt-4o-mini`
    *   *Pricing Assumption:* Input: ~$0.15 / Million tokens, Output: ~$0.60 / Million tokens

## Estimated Usage Per Session (6 Turns)

Let's assume:
*   Total candidate speaking time: 6 minutes
*   Total examiner speaking time (TTS generation): ~1500 characters (average 250 chars/question * 6 questions)
*   Question generation prompts (input + output): ~1500 tokens total (average 250 tokens/prompt * 6 prompts)
*   Rubric grading prompts (input + output): ~6000 tokens total (average 1500 tokens/rubric * 4 rubrics, assuming a moderately long transcript as input)

## Cost Breakdown Estimate Per Session

*   **STT:** 6 minutes * $0.003/min = **$0.018**
*   **TTS:** 1500 characters / 1000 * $0.015 = **$0.0225**
*   **Question Generation:** (1500 tokens / 1,000,000) * (Weighted average cost, e.g., $0.50/M tokens) ≈ **$0.00075** (Essentially negligible)
*   **Rubric Grading:** (6000 tokens / 1,000,000) * (Weighted average cost, e.g., $0.50/M tokens) ≈ **$0.003** (Negligible)

**Total Estimated Cost Per Session:** $0.018 + $0.0225 + $0.00075 + $0.003 ≈ **$0.044**

## Conclusion

The estimated cost per full 6-turn mock interview, including feedback, is roughly **$0.04 - $0.05 USD**. The main cost drivers are the Speech-to-Text and Text-to-Speech components.

**Disclaimer:** Always refer to the official OpenAI pricing page for the most up-to-date information. 