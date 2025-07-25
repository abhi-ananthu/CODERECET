const { default: z } = require('zod');
const model = require('./genai');

const { RunnableSequence } = require('@langchain/core/runnables');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');

const responseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  medialinks: z.array(
    z.object({
      label: z.string().min(1),
      link: z.string().min(1),
    })
  ),
});

// Use the top responseSchema instead of the previous zodSchema
const parser = StructuredOutputParser.fromZodSchema(responseSchema);

const generatePsTool = tool(() =>
  RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(
      'Answer the users question as best as possible.\n{format_instructions}\n{question}'
    ),
    model,
    parser,
  ])
);

const mapModelWithTool = () => {
  return model.bindTools(tool);
};
