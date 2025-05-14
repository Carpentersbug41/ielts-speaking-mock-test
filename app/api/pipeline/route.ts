import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';
import {
  RUBRIC_PROMPTS,
  parseRubricOutput,
  RubricResult,
} from '@/lib/rubricPrompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript: string = body.transcript;

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided for evaluation' }, { status: 400 });
    }

    console.log('Starting feedback pipeline for transcript...');

    const results: RubricResult[] = [];

    for (const rubric of RUBRIC_PROMPTS) {
      console.log(`Evaluating criterion: ${rubric.criterion}...`);

      // Replace placeholder with the actual transcript
      const filledPrompt = rubric.prompt_template.replace(
        '{{TRANSCRIPT}}',
        transcript
      );

      try {
        const completion = await openai.chat.completions.create({
          model: rubric.model || 'gpt-4o-mini', // Use the model from the prompt, fallback to default
          messages: [
            { role: "system", content: filledPrompt }, // Send the combined prompt as system message
          ],
          temperature: 0.1, // Low temperature for consistent evaluation
          max_tokens: 1500, // Increased to allow for longer AEEC output
        });

        const rawOutput = completion.choices[0]?.message?.content;

        if (rubric.criterion === 'AEEC Introduction') {
          // Special handling for AEEC Introduction: just return the raw output as feedback
          results.push({
            criterion: rubric.criterion,
            band_score: 0, // Not applicable, but required by type
            feedback: rawOutput || 'No introduction message generated.'
          });
          console.log(`Successfully evaluated: ${rubric.criterion} (AEEC Introduction special handling)`);
        } else if (rubric.criterion === 'AEEC Structure Advice') {
          // Special handling for AEEC rubric
          results.push({
            criterion: rubric.criterion,
            band_score: 0, // Not applicable, but required by type
            feedback: (rawOutput ? rawOutput + '\n\nNote: Band score is not applicable for AEEC Structure Advice.' : 'No advice generated.\n\nNote: Band score is not applicable for AEEC Structure Advice.')
          });
          console.log(`Successfully evaluated: ${rubric.criterion} (AEEC special handling)`);
        } else {
          const parsedResult = parseRubricOutput(rawOutput);

          if (parsedResult) {
            results.push({
              criterion: rubric.criterion,
              ...parsedResult,
            });
            console.log(`Successfully evaluated: ${rubric.criterion}`);
          } else {
            console.warn(`Could not parse output for criterion: ${rubric.criterion}. Raw output:`, rawOutput);
            // Optionally add a placeholder or skip this criterion
            results.push({
              criterion: rubric.criterion,
              band_score: 0, // Indicate failure
              feedback: `Error: Could not generate feedback for this criterion. Raw output: ${rawOutput || 'N/A'}`,
            });
          }
        }
      } catch (evalError) {
         console.error(`Error evaluating criterion ${rubric.criterion}:`, evalError);
         results.push({
           criterion: rubric.criterion,
           band_score: 0, // Indicate failure
           feedback: `Error: Failed to evaluate criterion due to API error.`,
         });
      }
    }

    console.log('Feedback pipeline completed.');

    return NextResponse.json({ feedback: results });

  } catch (error) {
    console.error('Pipeline API error:', error);
     if (error instanceof Error) {
        return NextResponse.json({ error: `Pipeline API failed: ${error.message}` }, { status: 500 });
    } else {
        return NextResponse.json({ error: 'An unknown error occurred in the feedback pipeline' }, { status: 500 });
    }
  }
} 