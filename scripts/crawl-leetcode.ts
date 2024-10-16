import TurndownService from "turndown";

import type { NewQuestion } from "../packages/schemas/src/questions";

const QUESTION_SLUGS = [
  "reverse-string",
  "linked-list-cycle",
  "roman-to-integer",
  "add-binary",
  "fibonacci-number",
  "implement-stack-using-queues",
  "combine-two-tables",
  "repeated-dna-sequences",
  "course-schedule",
  "lru-cache",
  "longest-common-subsequence",
  "rotate-image",
  "airplane-seat-assignment-probability",
  "validate-binary-search-tree",
  "sliding-window-maximum",
  "n-queens",
  "serialize-and-deserialize-binary-tree",
  "wildcard-matching",
  "chalkboard-xor-game",
  "trips-and-users",
];

const mdToHtml = new TurndownService();

function getGraphqlQuery(slug: string) {
  return {
    operationName: "questionData",
    variables: { titleSlug: slug },
    query: `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
          }
        }
      }
    `,
  };
}

function reformatQuestionContent(content: string) {
  return content
    .replace(/<p><strong class="example">Example (\d+):<\/strong><\/p>/g, "<h3>Example $1</h3>")
    .replace(/<p><strong>Example (\d+):<\/strong><\/p>/g, "<h3>Example $1</h3>")
    .replace(/<p><strong>Constraints:<\/strong><\/p>/g, "<h3>Constraints</h3>")
    .replace(/<strong>(Input|Output|Explanation):(\s?)<\/strong>/g, "$1:$2")
    .replace(/<pre>/g, "<pre><code>")
    .replace(/<\/pre>/g, "</code></pre>")
    .replaceAll("<p>&nbsp;</p>", "");
}

async function fetchQuestionData(slug: string): Promise<NewQuestion> {
  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(getGraphqlQuery(slug)),
  });
  const json: any = await response.json();

  return {
    title: json.data.question.title,
    content: mdToHtml.turndown(reformatQuestionContent(json.data.question.content)),
    difficulty: json.data.question.difficulty.toUpperCase(),
    tags: json.data.question.topicTags.map((tag: { name: string }) => tag.name),
    leetCodeLink: `https://leetcode.com/problems/${json.data.question.titleSlug}/`,
  };
}

async function main() {
  const questions = await Promise.all(QUESTION_SLUGS.map(fetchQuestionData));
  Bun.write("./data/questions.json", `${JSON.stringify(questions, null, 2)}\n`);
  console.log("Questions data written to data/questions.json");
}

main();
