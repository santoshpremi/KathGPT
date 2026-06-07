import "highlight.js/styles/github.css";
import type { ComponentProps, CSSProperties } from "react";
import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import RehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkDirective from "remark-directive";
import RemarkDirectiveRehype from "remark-directive-rehype";
import remarkGfm from "remark-gfm";
import { type RagSource } from "@backend/api/chat/message/messageTypes";
import { ReasoningQuote } from "./ReasoningQuote";
import { CodeBlock } from "./CodeBlock";
import { InlineCitation } from "./InlineCitation";
import RemarkCitePlugin from "./RemarkCitePlugin";

export interface HighlightInfo {
  x: number;
  y: number;
  text: string;
  context: string | null;
}

interface MarkdownRendererProps {
  content: string;
  style?: CSSProperties;
  sources?: RagSource[];
  onHighlight?: (data: HighlightInfo | null) => void;
}

interface ThoughtfulContent {
  content: string;
  thoughts: string | undefined;
  isThinking: boolean;
}

const remarkPlugins = [
  remarkDirective,
  remarkGfm,
  remarkBreaks,
  RemarkCitePlugin,
];
const rehypePlugins = [
  [
    RehypeHighlight,
    {
      ignoreMissing: true,
      detect: true,
    },
  ],
  RemarkDirectiveRehype,
] as ComponentProps<typeof ReactMarkdown>["rehypePlugins"];

function formatThoughtProcess(thoughtProcess: string | undefined) {
  return thoughtProcess
    ?.split("\n")
    .map((line) => "> " + line)
    .join("\n");
}

function getThoughtProcess(content: string): ThoughtfulContent {
  let thoughtProcess = content.match(/<think>([\s\S]*?)<\/think>/)?.[1];
  if (!thoughtProcess) {
    // check if thinking is still in process
    thoughtProcess = content.match(/<think>([\s\S]*)/)?.[1];
    return {
      thoughts: formatThoughtProcess(thoughtProcess),
      content: thoughtProcess ? "" : content,
      isThinking: !!thoughtProcess,
    };
  }
  return {
    thoughts: formatThoughtProcess(thoughtProcess),
    content: content.replace(/<think>[\s\S]*?<\/think>/, ""),
    isThinking: false,
  };
}

/**
 * Renders markdown content with syntax highlighting and citation support.
 * @param content The markdown content to render.
 * @param style Optional CSS styles to apply to the rendered content.
 * @param sources List of available sources for citations.
 */
function _MarkdownRenderer({
  content,
  style,
  sources,
  onHighlight,
}: MarkdownRendererProps) {
  const handleSelection = (event: React.MouseEvent) => {
    if (!onHighlight) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      onHighlight(null);
      return;
    }
    const selectedText = selection.toString().trim();
    const context = selection.getRangeAt(0).startContainer.textContent;
    if (selectedText) {
      onHighlight({
        x: event.clientX,
        y: event.clientY,
        text: selectedText,
        context,
      });
    }
  };

  const processedContent = useMemo<ThoughtfulContent>(() => {
    const { content: contentWithoutThoughtProcess, ...thoughtProcess } =
      getThoughtProcess(content);

    const markdownStart = "<artifact>";
    const markdownEnd = "</artifact>";

    const startIdx = contentWithoutThoughtProcess.indexOf(markdownStart);
    const endIdx = contentWithoutThoughtProcess.indexOf(
      markdownEnd,
      startIdx + markdownStart.length,
    );

    if (startIdx !== -1) {
      // if markdown start and end is found return content without markdown
      if (endIdx !== -1) {
        return {
          ...thoughtProcess,
          content:
            contentWithoutThoughtProcess.slice(0, startIdx) +
            contentWithoutThoughtProcess.slice(endIdx + markdownEnd.length),
        };
      }
      // if only start is found, return content up to start
      return {
        ...thoughtProcess,
        content: contentWithoutThoughtProcess.slice(0, startIdx),
      };
    }

    return {
      ...thoughtProcess,
      content: contentWithoutThoughtProcess,
    };
  }, [content]);

  return (
    <div
      className="markdown-body relative font-sans text-[15px] leading-relaxed text-neutral-800"
      style={{ fontFamily: "inherit", ...style }}
      onMouseUp={(e) => onHighlight && handleSelection(e)}
    >
      {processedContent.thoughts && (
        <ReasoningQuote
          thoughts={processedContent.thoughts}
          isThinking={processedContent.isThinking}
        />
      )}
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        className="white-space-pre-wrap leading-loose"
        skipHtml={true}
        components={{
          p: (pProps) => (
            <p {...pProps} dir="auto" className="pointer-events-auto" />
          ),
          a: (aProps) => {
            const href = aProps.href || "";
            const isInternal = /^\/#/i.test(href);
            const target = isInternal ? "_self" : aProps.target ?? "_blank";
            return <a {...aProps} target={target} />;
          },
          pre: CodeBlock,
          cite(props) {
            return sources != undefined && sources.length > 0 ? (
              <InlineCitation {...props} availableSources={sources ?? []} />
            ) : undefined;
          },
        }}
      >
        {processedContent.content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * {@inheritDoc _MarkdownRenderer}
 * Memoized version of {@link _MarkdownRenderer}.
 */
export const MarkdownRenderer = React.memo(_MarkdownRenderer);
